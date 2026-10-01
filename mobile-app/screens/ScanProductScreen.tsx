import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSizes, Radius, Spacing } from '../constants/colors';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { foodFactsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  HealthAssessment,
  PhotoFoodResult,
} from '../services/foodAnalysis';

type ScanMode = 'barcode' | 'photo' | 'manual' | 'result' | 'photoResult' | 'notFood';

export default function ScanProductScreen({ navigation }: { navigation?: any } = {}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('barcode');
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [lastBarcode, setLastBarcode] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [healthAnalysis, setHealthAnalysis] = useState<HealthAssessment | null>(null);
  const [nonFoodMessage, setNonFoodMessage] = useState<string>('');
  const [scanErrorType, setScanErrorType] = useState<'invalid-image' | 'service'>('invalid-image');
  
  // Photo scanning state
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoResult, setPhotoResult] = useState<PhotoFoodResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingKind, setLoadingKind] = useState<'barcode' | 'photo'>('barcode');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'nutrition' | 'warnings' | 'alternatives'>('overview');
  const user = useAuthStore((s) => s.user);

  const parseNutritionValue = (value: any): number | null => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  // 1. Fetch & Validate Barcode Product from OpenFoodFacts
  const fetchProduct = async (barcode: string) => {
    if (!barcode.trim()) {
      Alert.alert('Barcode Required', 'Please enter or scan a valid barcode number.');
      return;
    }
    setLoadingKind('barcode');
    setLoadingMessage(`Checking barcode ${barcode.trim()}…`);
    setLoading(true);
    setProduct(null);
    setHealthAnalysis(null);
    setActiveTab('overview');

    try {
      const { data } = await foodFactsAPI.getProduct(barcode.trim());
      
      if (data && data.isFoodItem && data.product) {
        const p = data.product;
        // Adapt backend format to UI expected format
        const productView = {
          product_name: p.name,
          brands: p.brand,
          image_front_url: p.imageUrl,
          ingredients_text: p.ingredients.join(', ')
        };
        
        const analysis: HealthAssessment = {
          nutriscoreGrade: p.nutriscoreGrade?.toLowerCase() || '',
          novaGroup: Number(p.novaGroup) || 0,
          healthLevel: 'unknown',
          healthScoreText: 'Product details from Open Food Facts. Check the package label; this is not an FDA safety rating.',
          nutritionSummary: {
             energyKcal: parseNutritionValue(p.nutrition?.calories),
             proteinG: parseNutritionValue(p.nutrition?.protein),
             carbsG: parseNutritionValue(p.nutrition?.carbs),
             fatG: parseNutritionValue(p.nutrition?.fat),
             sugarG: parseNutritionValue(p.nutrition?.sugar),
             satFatG: parseNutritionValue(p.nutrition?.saturatedFat),
             saltG: p.nutrition?.sodium != null ? Number(p.nutrition.sodium) / 1000 : null,
             fiberG: null,
             sodiumMg: parseNutritionValue(p.nutrition?.sodium)
          },
          additives: (p.additives || []).map((a:any) => ({
             code: a.code,
             name: a.name,
             risk: a.risk?.toLowerCase()?.includes('high') ? 'high' : 'low',
             dangerMsg: a.risk
          })),
          allergens: p.allergens || [],
          isHealthy: false,
          warnings: p.warnings || [],
          positives: [],
          healthierAlternatives: []
        };

        setProduct(productView);
        setHealthAnalysis(analysis);
        setMode('result');
      } else {
        setNonFoodMessage(data?.error || 'This barcode is not in the product dataset, so its food status and details could not be verified.');
        setMode('notFood');
      }
    } catch (err) {
      setNonFoodMessage('Unable to verify this barcode right now. Please check your connection and try again.');
      setMode('notFood');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleBarcodeScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLastBarcode(data);
    fetchProduct(data);
  };

  // 2. Photo-based Food Scan for Items Without Barcode
  const fetchPhotoData = async (imgUri: string) => {
    setLoadingKind('photo');
    setLoadingMessage('Analyzing your food photo… This may take a few seconds.');
    setLoading(true);
    try {
      const imageBase64 = await new Promise<string>(async (resolve, reject) => {
        if (Platform.OS !== 'web') {
          try {
            const FileSystem = await import('expo-file-system/legacy');
            const base64 = await FileSystem.readAsStringAsync(imgUri, { encoding: 'base64' });
            resolve(base64);
          } catch (error) { reject(error); }
          return;
        }
        try {
          const response = await fetch(imgUri);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            const encoded = String(reader.result || '').split(',')[1];
            encoded ? resolve(encoded) : reject(new Error('Could not read image'));
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        } catch (error) { reject(error); }
      });
      const { data } = await foodFactsAPI.scanImage(imageBase64);
      if (data && data.isFoodItem && data.product) {
        const p = data.product;
        const nutrition = p.nutrition || {};
        const analysis: HealthAssessment = {
          nutriscoreGrade: p.nutriscoreGrade?.toLowerCase() || '',
          novaGroup: Number(p.novaGroup) || 0,
          healthLevel: p.healthRisk?.level === 'high' ? 'unhealthy' : p.healthRisk?.level === 'low' ? 'healthy' : 'unknown',
          healthScoreText: p.healthRisk?.headline || p.nutritionSource || 'AI nutrition estimate; check food labels for exact values.',
          nutritionSummary: {
            energyKcal: parseNutritionValue(nutrition.calories),
            proteinG: parseNutritionValue(nutrition.protein),
            carbsG: parseNutritionValue(nutrition.carbs),
            sugarG: parseNutritionValue(nutrition.sugar),
            fatG: parseNutritionValue(nutrition.fat),
            satFatG: parseNutritionValue(nutrition.saturatedFat),
            saltG: parseNutritionValue(nutrition.salt),
            fiberG: parseNutritionValue(nutrition.fiber),
            sodiumMg: parseNutritionValue(nutrition.sodium)
          },
          additives: (p.additives || []).map((item: any) => typeof item === 'string' ? item : item.name || item.code),
          allergens: p.allergens || [],
          isHealthy: p.healthRisk?.level === 'low',
          warnings: [
            ...(p.safetyAlerts || []).map((alert: any) => alert.detail || alert.title || String(alert)),
            ...(p.warnings || [])
          ],
          positives: p.positiveFactors || [],
          healthierAlternatives: (p.healthierAlternatives || []).map((item: any) => typeof item === 'string'
            ? ({ name: item, icon: '🥗', category: 'Alternative', benefit: '' })
            : ({ name: item.name, icon: '🥗', category: 'Alternative', benefit: '', brand: item.brand, imageUrl: item.imageUrl, productUrl: item.productUrl, nutriscoreGrade: item.nutriscoreGrade, nutrition: item.nutrition }))
        };
        if (imgUri) setPhotoUri(imgUri);
        setProduct({
          product_name: p.name,
          brands: p.brand || 'Identified from photo',
          image_front_url: imgUri,
          ingredients_text: (p.ingredients || []).join(', '),
          nutritionSource: p.nutritionSource,
          aiFoodOverview: p.aiFoodOverview,
          adulterationAssessment: p.adulterationAssessment
        });
        setHealthAnalysis(analysis);
        setActiveTab('overview');
        setMode('result');
      } else {
        setNonFoodMessage(data?.error || 'Invalid food image. Try a clear photo focused on the food.');
        setScanErrorType('invalid-image');
        setMode('notFood');
      }
    } catch (e: any) {
      setNonFoodMessage(e?.response?.data?.error || e?.response?.data?.message || 'Food image recognition is unavailable. Please try again later.');
      setScanErrorType('service');
      setMode('notFood');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCapturePhoto = async (useCamera = true) => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        fetchPhotoData(uri);
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not open camera or gallery. Please check permissions.');
    }
  };

  return (
    <View style={styles.flex}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>
          {mode === 'result' || mode === 'photoResult'
            ? 'Food Safety & Health Report'
            : mode === 'notFood'
            ? 'Scan Verification'
            : 'FSSAI Food Safety Scanner'}
        </Text>
        <Text style={styles.headerSub}>
          {mode === 'result' || mode === 'photoResult'
            ? 'Nutritional & Adulteration Assessment'
            : 'Verified Food & Beverage Analysis'}
        </Text>
      </View>

      {/* Mode Selector (When not in result view) */}
      {mode !== 'result' && mode !== 'photoResult' && mode !== 'notFood' && (
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'barcode' && styles.modeTabActive]}
            onPress={() => { setMode('barcode'); setScanned(false); }}
          >
            <Text style={[styles.modeTabText, mode === 'barcode' && styles.modeTabTextActive]}>
              📷 Scan Barcode
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'photo' && styles.modeTabActive]}
            onPress={() => setMode('photo')}
          >
            <Text style={[styles.modeTabText, mode === 'photo' && styles.modeTabTextActive]}>
              🖼️ Photo Scan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'manual' && styles.modeTabActive]}
            onPress={() => setMode('manual')}
          >
            <Text style={[styles.modeTabText, mode === 'manual' && styles.modeTabTextActive]}>
              ⌨️ Enter Code
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODE 1: Camera Barcode Scanner */}
      {mode === 'barcode' && (
        <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.cameraWrapper}>
            {permission?.granted ? (
              <View style={styles.cameraBox}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  onBarcodeScanned={loading ? undefined : handleBarcodeScan}
                  barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'qr'] }}
                />
                <View style={styles.viewFinder}>
                  <View style={styles.scanLaser} />
                </View>
              </View>
            ) : (
              <View style={styles.permissionBox}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>📷</Text>
                <Text style={styles.permTitle}>Camera Access Required</Text>
                <Text style={styles.permSub}>Allow camera permissions to scan food barcodes</Text>
                <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
                  <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.foodOnlyNotice}>
              <Text style={styles.foodOnlyIcon}>🥗</Text>
              <Text style={styles.foodOnlyText}>
                SafeWatch scanner is specialized for <Text style={{ fontWeight: '800' }}>Food & Beverage</Text> products only. Non-food items (notebooks, stationery, electronics) are automatically rejected.
              </Text>
            </View>

          </View>
        </ScrollView>
      )}

      {/* MODE 2: Photo Scan for Food without Barcode */}
      {mode === 'photo' && (
        <ScrollView style={styles.flex} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={styles.photoHeaderCard}>
            <Text style={styles.photoCardTitle}>Scan Food Item (No Barcode)</Text>
            <Text style={styles.photoCardSub}>
              Take a photo of food to identify its likely name. The scan does not assess hygiene or safety.
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.photoBtnRow}>
            <TouchableOpacity style={styles.photoActionBtn} onPress={() => handleCapturePhoto(true)}>
              <Text style={styles.photoActionIcon}>📸</Text>
              <Text style={styles.photoActionTitle}>Take Live Photo</Text>
              <Text style={styles.photoActionSub}>Use Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoActionBtn} onPress={() => handleCapturePhoto(false)}>
              <Text style={styles.photoActionIcon}>🖼️</Text>
              <Text style={styles.photoActionTitle}>Upload Gallery</Text>
              <Text style={styles.photoActionSub}>Choose Image</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.photoCardSub}>Use a clear, close-up photo. Food recognition reports what the image model identifies; it does not estimate nutrition or verify food safety.</Text>
        </ScrollView>
      )}

      {/* MODE 3: Manual Barcode Input */}
      {mode === 'manual' && (
        <ScrollView style={styles.flex} contentContainerStyle={{ padding: 20 }}>
          <View style={styles.manualCard}>
            <Text style={styles.manualTitle}>Enter Packaged Food Barcode</Text>
            <Text style={styles.manualSub}>
              Enter the 8, 12, or 13-digit EAN/UPC barcode printed on the food package.
            </Text>

            <Input
              label="EAN / UPC Barcode Number"
              placeholder="e.g. 8901058851008"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="numeric"
            />

            <Button
              title="Verify & Analyze Food"
              onPress={() => fetchProduct(manualBarcode)}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      )}

      {/* NON-FOOD OR UNRECOGNIZED BARCODE VIEW */}
      {mode === 'notFood' && (
        <ScrollView style={styles.flex} contentContainerStyle={styles.notFoodContainer}>
          <View style={styles.notFoodIconCircle}>
            <Text style={{ fontSize: 48 }}>🚫</Text>
          </View>
          <Text style={styles.notFoodTitle}>{scanErrorType === 'service' ? 'Scanner Unavailable' : nonFoodMessage.toLowerCase().includes('invalid food image') ? 'Invalid Food Image' : 'Non-Food or Unrecognized Item'}</Text>
          <Text style={styles.notFoodDesc}>{nonFoodMessage}</Text>

          <View style={styles.notFoodAdviceBox}>
            <Text style={styles.adviceHeading}>💡 SafeWatch Guidelines:</Text>
            <Text style={styles.advicePoint}>• Only edible food & beverages under FSSAI purview can be analyzed.</Text>
            <Text style={styles.advicePoint}>• Stationeries, notebooks, clothes, and electronics do not contain nutrition data.</Text>
            <Text style={styles.advicePoint}>• For unbranded or fresh cooked foods, use the Photo Food Scanner.</Text>
          </View>

          <View style={{ width: '100%', gap: 12, marginTop: 24 }}>
            <Button
              title="🖼️ Try Photo Food Scan"
              onPress={() => setMode('photo')}
              fullWidth
              size="lg"
            />
            <Button
              title="📷 Scan Another Barcode"
              variant="outline"
              onPress={() => {
                setMode('barcode');
                setScanned(false);
              }}
              fullWidth
            />
          </View>
        </ScrollView>
      )}

      {/* MODE 4: Barcode Scan Results (Nutri-Score, Warnings, Healthy Alternatives) */}
      {mode === 'result' && product && healthAnalysis && (
        <ScrollView style={styles.flex} contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
          {/* Product Header */}
          <View style={styles.resCard}>
            <View style={styles.resTopRow}>
              {product.image_front_url || product.image_url ? (
                <Image
                  source={{ uri: product.image_front_url || product.image_url }}
                  style={styles.resImg}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.resImgPlaceholder}>
                  <Text style={{ fontSize: 36 }}>🥗</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.resProductName}>{product.product_name || 'Food Product'}</Text>
                <Text style={styles.resBrand}>{product.brands || 'Packaged Food'}</Text>
                <View style={styles.badgeRow}>
                  {healthAnalysis.nutriscoreGrade && (
                    <View
                      style={[
                        styles.nutriBadge,
                        {
                          backgroundColor:
                            healthAnalysis.nutriscoreGrade === 'a'
                              ? '#038141'
                              : healthAnalysis.nutriscoreGrade === 'b'
                              ? '#85BB2F'
                              : healthAnalysis.nutriscoreGrade === 'c'
                              ? '#FECB02'
                              : healthAnalysis.nutriscoreGrade === 'd'
                              ? '#EE8100'
                              : '#E63312',
                        },
                      ]}
                    >
                      <Text style={styles.nutriBadgeText}>
                        Nutri-Score {healthAnalysis.nutriscoreGrade.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {healthAnalysis.novaGroup && (
                    <View style={styles.novaBadge}>
                      <Text style={styles.novaText}>NOVA {healthAnalysis.novaGroup}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Health Assessment Status Banner */}
            <View
              style={[
                styles.healthBanner,
                healthAnalysis.healthLevel === 'healthy'
                  ? styles.healthBannerGreen
                  : healthAnalysis.healthLevel === 'unhealthy'
                  ? styles.healthBannerRed
                  : styles.healthBannerAmber,
              ]}
            >
              <Text
                style={[
                  styles.healthBannerText,
                  healthAnalysis.healthLevel === 'healthy'
                    ? styles.healthTextGreen
                    : healthAnalysis.healthLevel === 'unhealthy'
                    ? styles.healthTextRed
                    : styles.healthTextAmber,
                ]}
              >
                {healthAnalysis.healthScoreText}
              </Text>
            </View>
          </View>

          {/* Result Tabs */}
          <View style={styles.tabNav}>
            {(['overview', 'nutrition', 'warnings', 'alternatives'] as const)
              .filter((tab) => tab !== 'alternatives' || healthAnalysis.healthierAlternatives.length > 0)
              .map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabNavItem, activeTab === t && styles.tabNavItemActive]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabNavText, activeTab === t && styles.tabNavTextActive]}>
                  {t === 'overview'
                    ? 'Overview'
                    : t === 'nutrition'
                    ? 'Nutrition'
                    : t === 'warnings'
                    ? 'Alerts'
                    : 'Alternatives'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <View style={styles.sectionBody}>
              <Text style={styles.subHeading}>Key Nutrition Highlights (per 100g/ml)</Text>
              <View style={styles.macroGrid}>
                <View style={styles.macroBox}>
                  <Text style={styles.macroVal}>
                    {healthAnalysis.nutritionSummary.energyKcal ?? '—'}
                  </Text>
                  <Text style={styles.macroLbl}>Calories (kcal)</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroVal}>
                    {healthAnalysis.nutritionSummary.proteinG != null ? `${healthAnalysis.nutritionSummary.proteinG}g` : '—'}
                  </Text>
                  <Text style={styles.macroLbl}>Protein</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text
                    style={[
                      styles.macroVal,
                      (healthAnalysis.nutritionSummary.sugarG || 0) > 15 && { color: Colors.danger },
                    ]}
                  >
                    {healthAnalysis.nutritionSummary.sugarG != null ? `${healthAnalysis.nutritionSummary.sugarG}g` : '—'}
                  </Text>
                  <Text style={styles.macroLbl}>Sugar</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroVal}>
                    {healthAnalysis.nutritionSummary.fatG != null ? `${healthAnalysis.nutritionSummary.fatG}g` : '—'}
                  </Text>
                  <Text style={styles.macroLbl}>Fat</Text>
                </View>
              </View>

              <Text style={[styles.subHeading, { marginTop: 16 }]}>Positive Nutritional Factors</Text>
              {healthAnalysis.positives.map((pos, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.greenCheck}>✓</Text>
                  <Text style={styles.bulletText}>{pos}</Text>
                </View>
              ))}

              {product.ingredients_text && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.subHeading}>Ingredients List</Text>
                  <Text style={styles.ingredientsText}>{product.ingredients_text}</Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 2: NUTRITION */}
          {activeTab === 'nutrition' && (
            <View style={styles.sectionBody}>
              <Text style={styles.subHeading}>Detailed Nutritional Profile</Text>
              <View style={styles.tableCard}>
                {[
                  { label: 'Energy', val: `${healthAnalysis.nutritionSummary.energyKcal ?? '—'} kcal` },
                  { label: 'Proteins', val: `${healthAnalysis.nutritionSummary.proteinG ?? '—'} g` },
                  { label: 'Carbohydrates', val: `${healthAnalysis.nutritionSummary.carbsG ?? '—'} g` },
                  { label: 'Sugars', val: `${healthAnalysis.nutritionSummary.sugarG ?? '—'} g` },
                  { label: 'Total Fats', val: `${healthAnalysis.nutritionSummary.fatG ?? '—'} g` },
                  { label: 'Saturated Fat', val: `${healthAnalysis.nutritionSummary.satFatG ?? '—'} g` },
                  { label: 'Dietary Fiber', val: `${healthAnalysis.nutritionSummary.fiberG ?? '—'} g` },
                  healthAnalysis.nutritionSummary.sodiumMg != null
                    ? { label: 'Sodium', val: `${healthAnalysis.nutritionSummary.sodiumMg} mg` }
                    : { label: 'Sodium / Salt', val: `${healthAnalysis.nutritionSummary.saltG ?? '—'} g` },
                ].map((row, idx) => (
                  <View key={row.label} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowEven]}>
                    <Text style={styles.tableLabel}>{row.label}</Text>
                    <Text style={styles.tableValue}>{row.val}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'warnings' && (
            <View style={styles.sectionBody}>
              <Text style={styles.subHeading}>Health Flags & Food Safety Alerts</Text>
              {healthAnalysis.warnings.length ? healthAnalysis.warnings.map((warning, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.greenCheck}>•</Text>
                  <Text style={styles.bulletText}>{warning}</Text>
                </View>
              )) : <Text style={styles.bulletText}>No nutrient alerts were identified from the available nutrition information.</Text>}
              {product.nutritionSource && <Text style={[styles.bulletText, { marginTop: 14 }]}>{product.nutritionSource}</Text>}
              {product.adulterationAssessment && <Text style={[styles.bulletText, { marginTop: 10 }]}>{product.adulterationAssessment}</Text>}
            </View>
          )}

          {activeTab === 'alternatives' && (
            <View style={styles.sectionBody}>
              <Text style={styles.subHeading}>Recommended Alternatives</Text>
              {healthAnalysis.healthierAlternatives.length ? healthAnalysis.healthierAlternatives.map((alternative, idx) => (
                <View key={idx} style={styles.alternativeProductRow}>
                  {alternative.imageUrl ? <Image source={{ uri: alternative.imageUrl }} style={styles.alternativeProductImage} resizeMode="contain" /> : <Text style={styles.greenCheck}>{alternative.icon}</Text>}
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.bulletText}>{alternative.name}</Text>
                    {alternative.brand ? <Text style={styles.alternativeProductMeta}>{alternative.brand}</Text> : null}
                    {alternative.nutriscoreGrade ? <Text style={styles.alternativeProductMeta}>Nutri-Score {alternative.nutriscoreGrade.toUpperCase()}</Text> : null}
                    {(alternative.nutrition?.sugar || alternative.nutrition?.saturatedFat) ? <Text style={styles.alternativeProductMeta}>{[alternative.nutrition.sugar && `Sugar: ${alternative.nutrition.sugar}`, alternative.nutrition.saturatedFat && `Saturated fat: ${alternative.nutrition.saturatedFat}`].filter(Boolean).join(' · ')}</Text> : null}
                  </View>
                </View>
              )) : <Text style={styles.bulletText}>No specific alternative was recommended from the available nutrition information.</Text>}
            </View>
          )}
          {/* Action Bar */}
          <View style={{ gap: 12, marginTop: 24 }}>
            <Button
              title="📷 Scan Another Food Item"
              variant="outline"
              onPress={() => {
                setMode('barcode');
                setScanned(false);
                setProduct(null);
                setHealthAnalysis(null);
              }}
              fullWidth
            />
          </View>
        </ScrollView>
      )}

      {/* MODE 5: Photo Scan Result for Unpackaged / Fresh Food */}
      {mode === 'photoResult' && photoResult && (
        <ScrollView style={styles.flex} contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
          <View style={styles.resCard}>
            {photoUri && <Image source={{ uri: photoUri }} style={styles.photoPreviewImg} resizeMode="cover" />}
            <Text style={styles.photoDishTitle}>{photoResult.dishName}</Text>
            <Text style={styles.photoCategoryBadge}>{photoResult.category}</Text>
          </View>
          <View style={styles.sectionBody}>
            <Text style={styles.subHeading}>Image recognition result</Text>
            <Text style={styles.bulletText}>
              This model prediction identifies a likely food label. A photo cannot verify nutrition, ingredients, allergens, freshness, adulteration, or whether food is safe to eat.
            </Text>
          </View>
          {/* Action Bar */}
          <View style={{ gap: 12, marginTop: 24 }}>
            <Button
              title="📝 Report Food Safety / Hygiene Issue"
              variant="outline"
              onPress={() => navigation?.navigate('Report')}
              fullWidth
            />
            <Button
              title="📸 Take Another Photo Scan"
              variant="outline"
              onPress={() => {
                setMode('photo');
                setPhotoUri(null);
                setPhotoResult(null);
              }}
              fullWidth
            />
          </View>
        </ScrollView>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0F4C3A" />
            <Text style={styles.loadingTitle}>
              {loadingKind === 'barcode' ? (mode === 'barcode' ? 'Barcode detected' : 'Checking barcode') : 'Photo scan in progress'}
            </Text>
            <Text style={styles.loadingText}>{loadingMessage}</Text>
            {loadingKind === 'barcode' && lastBarcode ? (
              <Text style={styles.loadingCode}>Code: {lastBarcode}</Text>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    elevation: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE7E2',
  },
  loadingTitle: { fontSize: 17, fontWeight: '800', color: '#0F4C3A', marginTop: 16, textAlign: 'center' },
  loadingText: { fontSize: 13, lineHeight: 19, color: '#475569', marginTop: 7, textAlign: 'center' },
  loadingCode: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 10 },
  topHeader: {
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  headerSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  modeTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#0F4C3A',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  cameraWrapper: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  cameraBox: {
    width: '100%',
    height: 270,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewFinder: {
    width: 220,
    height: 140,
    borderWidth: 2.5,
    borderColor: '#10B981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLaser: {
    width: '90%',
    height: 2,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  permissionBox: {
    width: '100%',
    height: 270,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  permSub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 14 },
  grantBtn: { backgroundColor: '#0F4C3A', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  grantBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  foodOnlyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 10,
  },
  foodOnlyIcon: { fontSize: 24 },
  foodOnlyText: { flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 17 },
  photoHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  photoCardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  photoCardSub: { fontSize: 13, color: '#64748B', lineHeight: 19 },
  photoBtnRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  photoActionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0F4C3A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  photoActionIcon: { fontSize: 32, marginBottom: 6 },
  photoActionTitle: { fontSize: 14, fontWeight: '800', color: '#0F4C3A' },
  photoActionSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
  commonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  commonCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  commonIcon: { fontSize: 22 },
  commonLabel: { fontSize: 12, fontWeight: '700', color: '#334155', flex: 1 },
  manualCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  manualTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  manualSub: { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 16 },
  notFoodContainer: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  notFoodIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  notFoodTitle: { fontSize: 19, fontWeight: '800', color: '#991B1B', marginBottom: 8, textAlign: 'center' },
  notFoodDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  notFoodAdviceBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    width: '100%',
  },
  adviceHeading: { fontSize: 13, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  advicePoint: { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 4 },
  resCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  resTopRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  resImg: { width: 70, height: 70, borderRadius: 8 },
  resImgPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resProductName: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  resBrand: { fontSize: 13, color: '#64748B', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  nutriBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  nutriBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  novaBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  novaText: { color: '#334155', fontSize: 10, fontWeight: '800' },
  healthBanner: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  healthBannerGreen: { backgroundColor: '#DCFCE7' },
  healthBannerRed: { backgroundColor: '#FEE2E2' },
  healthBannerAmber: { backgroundColor: '#FEF3C7' },
  healthBannerText: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  healthTextGreen: { color: '#15803D' },
  healthTextRed: { color: '#B91C1C' },
  healthTextAmber: { color: '#B45309' },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  tabNavItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabNavItemActive: { backgroundColor: '#0F4C3A' },
  tabNavText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabNavTextActive: { color: '#FFFFFF' },
  sectionBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  subHeading: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
  macroGrid: { flexDirection: 'row', gap: 8 },
  macroBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  macroVal: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  macroLbl: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  greenCheck: { color: '#15803D', fontWeight: '800', fontSize: 14 },
  blueCheck: { color: '#0284C7', fontWeight: '800', fontSize: 16 },
  bulletText: { flex: 1, fontSize: 13, color: '#334155', lineHeight: 18 },
  ingredientsText: { fontSize: 12, color: '#64748B', lineHeight: 18, fontStyle: 'italic' },
  tableCard: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden' },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableRowEven: { backgroundColor: '#F8FAFC' },
  tableLabel: { fontSize: 13, color: '#475569', fontWeight: '600' },
  tableValue: { fontSize: 13, color: '#1E293B', fontWeight: '700' },
  warningItem: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF1F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E11D48',
  },
  warnIcon: { fontSize: 16 },
  warnText: { flex: 1, fontSize: 12, color: '#9F1239', fontWeight: '600', lineHeight: 17 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  additiveChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  additiveText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  allergenChip: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  allergenText: { fontSize: 11, fontWeight: '700', color: '#991B1B' },
  altHeaderCard: { marginBottom: 14 },
  altMainTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  altMainSub: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  alternativeProductRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 10, marginBottom: 8 },
  alternativeProductImage: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#FFFFFF' },
  alternativeProductMeta: { fontSize: 11, color: '#64748B' },
  altList: { gap: 10 },
  altCardFull: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  altEmoji: { fontSize: 28 },
  altTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  altNameText: { fontSize: 13, fontWeight: '800', color: '#1E293B', flex: 1 },
  altCategoryBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  altCategoryText: { fontSize: 9, fontWeight: '800', color: '#15803D' },
  altBenefitText: { fontSize: 11, color: '#0F4C3A', fontWeight: '600' },
  photoPreviewImg: { width: '100%', height: 180, borderRadius: 10, marginBottom: 12 },
  photoDishTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  photoCategoryBadge: { fontSize: 12, color: '#64748B', marginBottom: 10 },
  adulterationBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
  },
  adulterationTitle: { fontSize: 12, fontWeight: '800', color: '#92400E', marginBottom: 4 },
  adulterationDesc: { fontSize: 11, color: '#78350F', lineHeight: 16 },
  healthyCelebrationCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  healthyCelebrationTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
    textAlign: 'center',
    marginBottom: 6,
  },
  healthyCelebrationSub: {
    fontSize: 12,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  healthyHighlightsBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  healthyHighlightsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 10,
  },
});
