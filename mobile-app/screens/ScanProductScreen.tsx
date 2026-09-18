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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSizes, Radius, Spacing } from '../constants/colors';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { foodFactsAPI, userAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  validateIsFoodProduct,
  analyzeProductHealth,
  analyzeFoodPhoto,
  HealthAssessment,
  PhotoFoodResult,
} from '../services/foodAnalysis';

type ScanMode = 'barcode' | 'photo' | 'manual' | 'result' | 'photoResult' | 'notFood';

const COMMON_DISH_SUGGESTIONS = [
  { label: 'Samosa / Fried Snack', icon: '🥟', query: 'samosa' },
  { label: 'Fresh Milk', icon: '🥛', query: 'milk' },
  { label: 'Fresh Paneer', icon: '🧀', query: 'paneer' },
  { label: 'Mithai / Sweets', icon: '🍬', query: 'sweet' },
  { label: 'Fresh Fruits / Veggies', icon: '🍎', query: 'fruit' },
  { label: 'Cooked Thali / Meal', icon: '🍛', query: 'meal' },
];

export default function ScanProductScreen({ navigation }: { navigation?: any } = {}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('barcode');
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [lastBarcode, setLastBarcode] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [healthAnalysis, setHealthAnalysis] = useState<HealthAssessment | null>(null);
  const [nonFoodMessage, setNonFoodMessage] = useState<string>('');
  
  // Photo scanning state
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoDishName, setPhotoDishName] = useState<string>('');
  const [photoResult, setPhotoResult] = useState<PhotoFoodResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'nutrition' | 'warnings' | 'alternatives'>('overview');
  const user = useAuthStore((s) => s.user);

  // 1. Fetch & Validate Barcode Product from OpenFoodFacts
  const fetchProduct = async (barcode: string) => {
    if (!barcode.trim()) {
      Alert.alert('Barcode Required', 'Please enter or scan a valid barcode number.');
      return;
    }
    setLoading(true);
    setProduct(null);
    setHealthAnalysis(null);

    try {
      const { data } = await foodFactsAPI.getProduct(barcode.trim());
      
      if (data && data.status === 1 && data.product) {
        const prod = data.product;
        
        // Strictly validate if the item is a food product
        const validation = validateIsFoodProduct(prod);
        
        if (!validation.isFood) {
          setNonFoodMessage(validation.reason || 'Item is not an edible food product under FSSAI jurisdiction.');
          setMode('notFood');
          return;
        }

        // Perform in-depth health, additives, and nutrition assessment
        const analysis = analyzeProductHealth(prod);
        setProduct(prod);
        setHealthAnalysis(analysis);
        setMode('result');
      } else {
        // Product not found in food database
        setNonFoodMessage(
          `Barcode "${barcode.trim()}" was not found in the Food & Beverage database or is a non-food item (e.g. books, notebooks, hardware).\n\nIf this is an unpackaged or local food item without a barcode, please use the "Photo Scan (No Barcode)" option!`
        );
        setMode('notFood');
      }
    } catch (err) {
      setNonFoodMessage(
        `Unable to verify barcode "${barcode.trim()}". Please ensure you are scanning a packaged food or beverage item, or try Photo Scan.`
      );
      setMode('notFood');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLastBarcode(data);
    fetchProduct(data);
  };

  // 2. Photo-based Food Scan for Items Without Barcode
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
        // Analyze the photo with current dish query or default
        const analysis = analyzeFoodPhoto(photoDishName || 'general food');
        setPhotoResult(analysis);
        setMode('photoResult');
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not open camera or gallery. Please check permissions.');
    }
  };

  const handleAnalyzeCustomDish = (dishText: string) => {
    setPhotoDishName(dishText);
    const analysis = analyzeFoodPhoto(dishText);
    setPhotoResult(analysis);
  };

  // 3. Save Product Handler
  const handleSaveProduct = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to save items to your health dashboard.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation?.navigate('Login') },
      ]);
      return;
    }
    setSaving(true);
    try {
      const name = mode === 'result' ? (product?.product_name || 'Food Product') : (photoResult?.dishName || 'Scanned Food');
      const brand = mode === 'result' ? (product?.brands || 'Packaged Food') : (photoResult?.category || 'Unpackaged Food');
      const barcodeVal = mode === 'result' ? (lastBarcode || 'barcode-item') : 'photo-scan';
      const grade = mode === 'result' ? (healthAnalysis?.nutriscoreGrade || 'c') : (photoResult?.healthLevel === 'healthy' ? 'a' : 'd');
      const img = mode === 'result' ? (product?.image_front_url || product?.image_url || '') : (photoUri || '');

      await userAPI.saveProduct({
        barcode: barcodeVal,
        name,
        brand,
        imageUrl: img,
        nutriscoreGrade: grade,
      });
      setSaved(true);
      Alert.alert('Saved!', `"${name}" added to your Saved Products.`);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        Alert.alert('Already Saved', 'This item is already in your saved list.');
        setSaved(true);
      } else {
        Alert.alert('Error', 'Could not save item. Try again.');
      }
    } finally {
      setSaving(false);
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
                  onBarcodeScanned={handleBarcodeScan}
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

            <View style={styles.sampleBox}>
              <Text style={styles.sampleHeader}>Quick Test Food Samples:</Text>
              <View style={styles.sampleGrid}>
                <TouchableOpacity
                  style={styles.sampleChip}
                  onPress={() => fetchProduct('8901058851008')}
                >
                  <Text style={styles.sampleChipText}>🥛 Amul Toned Milk</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sampleChip}
                  onPress={() => fetchProduct('8901030018153')}
                >
                  <Text style={styles.sampleChipText}>🍫 Dark Chocolate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sampleChip}
                  onPress={() => fetchProduct('8901725181222')}
                >
                  <Text style={styles.sampleChipText}>🍿 Roasted Makhana</Text>
                </TouchableOpacity>
              </View>
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
              Take a photo of street food, fresh produce, cooked meals, bakery sweets, or loose dairy to assess hygiene, safety risks, and healthy alternatives.
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

          {/* Quick Select Common Dish */}
          <Text style={styles.sectionHeader}>Or Select Food Type to Analyze:</Text>
          <View style={styles.commonGrid}>
            {COMMON_DISH_SUGGESTIONS.map((item) => (
              <TouchableOpacity
                key={item.query}
                style={styles.commonCard}
                onPress={() => {
                  setPhotoDishName(item.label);
                  const res = analyzeFoodPhoto(item.query);
                  setPhotoResult(res);
                  setMode('photoResult');
                }}
              >
                <Text style={styles.commonIcon}>{item.icon}</Text>
                <Text style={styles.commonLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
          <Text style={styles.notFoodTitle}>Non-Food or Unrecognized Item</Text>
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
            {(['overview', 'nutrition', 'warnings', 'alternatives'] as const).map((t) => (
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
                    {healthAnalysis.nutritionSummary.proteinG !== undefined ? `${healthAnalysis.nutritionSummary.proteinG}g` : '—'}
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
                    {healthAnalysis.nutritionSummary.sugarG !== undefined ? `${healthAnalysis.nutritionSummary.sugarG}g` : '—'}
                  </Text>
                  <Text style={styles.macroLbl}>Sugar</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroVal}>
                    {healthAnalysis.nutritionSummary.fatG !== undefined ? `${healthAnalysis.nutritionSummary.fatG}g` : '—'}
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
                  { label: 'Sodium / Salt', val: `${healthAnalysis.nutritionSummary.saltG ?? '—'} g` },
                ].map((row, idx) => (
                  <View key={row.label} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowEven]}>
                    <Text style={styles.tableLabel}>{row.label}</Text>
                    <Text style={styles.tableValue}>{row.val}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 3: HEALTH ALERTS & WARNINGS */}
          {activeTab === 'warnings' && (
            <View style={styles.sectionBody}>
              <Text style={styles.subHeading}>Health Flags & Food Safety Alerts</Text>
              {healthAnalysis.warnings.map((warn, idx) => (
                <View key={idx} style={styles.warningItem}>
                  <Text style={styles.warnIcon}>⚠️</Text>
                  <Text style={styles.warnText}>{warn}</Text>
                </View>
              ))}

              {healthAnalysis.additives.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.subHeading}>Detected Additives ({healthAnalysis.additives.length})</Text>
                  <View style={styles.tagWrap}>
                    {healthAnalysis.additives.map((add, idx) => (
                      <View key={idx} style={styles.additiveChip}>
                        <Text style={styles.additiveText}>{add}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {healthAnalysis.allergens.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.subHeading}>Allergen Information</Text>
                  <View style={styles.tagWrap}>
                    {healthAnalysis.allergens.map((alg, idx) => (
                      <View key={idx} style={styles.allergenChip}>
                        <Text style={styles.allergenText}>🚨 {alg}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* TAB 4: HEALTHIER ALTERNATIVES */}
          {activeTab === 'alternatives' && (
            <View style={styles.sectionBody}>
              {healthAnalysis.isHealthy ? (
                <View style={styles.healthyCelebrationCard}>
                  <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
                  <Text style={styles.healthyCelebrationTitle}>
                    This Product is Already a Healthy Choice!
                  </Text>
                  <Text style={styles.healthyCelebrationSub}>
                    {product.product_name || 'This food item'} has an excellent nutritional quality rating (Nutri-Score {healthAnalysis.nutriscoreGrade.toUpperCase()}, NOVA {healthAnalysis.novaGroup}) with natural wholesome ingredients. No alternative food replacement is required!
                  </Text>

                  <View style={styles.healthyHighlightsBox}>
                    <Text style={styles.healthyHighlightsTitle}>🌟 Key Nutritional Benefits:</Text>
                    {healthAnalysis.positives.map((pos, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Text style={styles.greenCheck}>✓</Text>
                        <Text style={styles.bulletText}>{pos}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.altHeaderCard}>
                    <Text style={styles.altMainTitle}>
                      🥗 Recommended Healthier Food Substitutes
                    </Text>
                    <Text style={styles.altMainSub}>
                      Because this product contains high sugar, saturated fats or industrial processing, FSSAI SafeWatch recommends these clean nutritional alternatives:
                    </Text>
                  </View>

                  <View style={styles.altList}>
                    {healthAnalysis.healthierAlternatives.map((alt, idx) => (
                      <View key={idx} style={styles.altCardFull}>
                        <Text style={styles.altEmoji}>{alt.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <View style={styles.altTitleRow}>
                            <Text style={styles.altNameText}>{alt.name}</Text>
                            <View style={styles.altCategoryBadge}>
                              <Text style={styles.altCategoryText}>{alt.category}</Text>
                            </View>
                          </View>
                          <Text style={styles.altBenefitText}>✓ {alt.benefit}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Action Bar */}
          <View style={{ gap: 12, marginTop: 24 }}>
            <Button
              title={saved ? '✅ Saved in My Products' : saving ? 'Saving…' : '📦 Save to My Products'}
              onPress={handleSaveProduct}
              loading={saving}
              disabled={saved || saving}
              fullWidth
              size="lg"
            />
            <Button
              title="📷 Scan Another Food Item"
              variant="outline"
              onPress={() => {
                setMode('barcode');
                setScanned(false);
                setSaved(false);
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
            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.photoPreviewImg} resizeMode="cover" />
            )}
            <Text style={styles.photoDishTitle}>{photoResult.dishName}</Text>
            <Text style={styles.photoCategoryBadge}>{photoResult.category}</Text>

            {/* Health status */}
            <View
              style={[
                styles.healthBanner,
                photoResult.healthLevel === 'healthy'
                  ? styles.healthBannerGreen
                  : photoResult.healthLevel === 'unhealthy'
                  ? styles.healthBannerRed
                  : styles.healthBannerAmber,
              ]}
            >
              <Text
                style={[
                  styles.healthBannerText,
                  photoResult.healthLevel === 'healthy'
                    ? styles.healthTextGreen
                    : photoResult.healthLevel === 'unhealthy'
                    ? styles.healthTextRed
                    : styles.healthTextAmber,
                ]}
              >
                {photoResult.healthLevel === 'healthy'
                  ? '🟢 Natural / Nutrient-Rich Whole Food'
                  : photoResult.healthLevel === 'unhealthy'
                  ? '🔴 High Calorie / Saturated Fat Risk'
                  : '🟡 Moderate Caloric Intake'}
              </Text>
            </View>
          </View>

          {/* Nutrition Estimate */}
          <View style={styles.sectionBody}>
            <Text style={styles.subHeading}>Estimated Nutritional Breakdown</Text>
            <View style={styles.macroGrid}>
              <View style={styles.macroBox}>
                <Text style={styles.macroVal}>{photoResult.estimatedCalories}</Text>
                <Text style={styles.macroLbl}>Calories (kcal)</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroVal}>{photoResult.protein}</Text>
                <Text style={styles.macroLbl}>Protein</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroVal}>{photoResult.carbs}</Text>
                <Text style={styles.macroLbl}>Carbs</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroVal}>{photoResult.fat}</Text>
                <Text style={styles.macroLbl}>Fats</Text>
              </View>
            </View>
          </View>

          {/* FSSAI Safety & Hygiene Guidance */}
          <View style={styles.sectionBody}>
            <Text style={styles.subHeading}>🛡️ FSSAI Food Safety & Hygiene Advisory</Text>
            {photoResult.fssaiSafetyTips.map((tip, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.blueCheck}>•</Text>
                <Text style={styles.bulletText}>{tip}</Text>
              </View>
            ))}

            {photoResult.adulterationTest && (
              <View style={styles.adulterationBox}>
                <Text style={styles.adulterationTitle}>🔬 Home Adulteration Detection Test:</Text>
                <Text style={styles.adulterationDesc}>{photoResult.adulterationTest}</Text>
              </View>
            )}
          </View>

          {/* Healthier Alternatives */}
          <View style={styles.sectionBody}>
            <Text style={styles.subHeading}>🥗 Healthier Alternative Recommendations</Text>
            <View style={styles.altList}>
              {photoResult.healthierAlternatives.map((alt, idx) => (
                <View key={idx} style={styles.altCardFull}>
                  <Text style={styles.altEmoji}>{alt.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.altTitleRow}>
                      <Text style={styles.altNameText}>{alt.name}</Text>
                      <View style={styles.altCategoryBadge}>
                        <Text style={styles.altCategoryText}>{alt.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.altBenefitText}>✓ {alt.benefit}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Action Bar */}
          <View style={{ gap: 12, marginTop: 24 }}>
            <Button
              title={saved ? '✅ Saved in My Products' : saving ? 'Saving…' : '📦 Save to My Products'}
              onPress={handleSaveProduct}
              loading={saving}
              disabled={saved || saving}
              fullWidth
              size="lg"
            />
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
                setSaved(false);
              }}
              fullWidth
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
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
  sampleBox: { width: '100%', marginTop: 20 },
  sampleHeader: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
  sampleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sampleChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sampleChipText: { fontSize: 12, fontWeight: '600', color: '#334155' },
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
