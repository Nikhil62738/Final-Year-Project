import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Colors, FontSizes, Radius, Spacing } from '../constants/colors';
import { COMPLAINT_CATEGORIES, MAHARASHTRA_DISTRICTS, MAHARASHTRA_TALUKAS } from '../constants/categories';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { complaintsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const STEPS = ['Issue Details', 'Location & Evidence', 'Contact Details', 'Review & Submit'];

interface ReportScreenProps {
  navigation?: any;
  onSuccess?: (trackingCode: string) => void;
  onBack?: () => void;
}

export default function ReportComplaintScreen({
  navigation,
  onSuccess,
  onBack,
}: ReportScreenProps = {}) {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const [form, setForm] = useState({
    category: '',
    description: '',
    vendorName: '',
    district: 'Mumbai Suburban',
    taluka: 'Andheri',
    address: '',
    lat: '19.0760',
    lng: '72.8777',
    anonymous: false,
    complainantName: user?.name || '',
    complainantPhone: user?.phone || '',
    preferredLanguage: 'English',
    receivesSms: true,
    receivesWhatsapp: true,
  });

  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showTalukaModal, setShowTalukaModal] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [talukaSearch, setTalukaSearch] = useState('');

  const [evidence, setEvidence] = useState<any[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState('');

  const update = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const checkAiSuggestion = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes('expired') || d.includes('expiry') || d.includes('date')) {
      setAiSuggestion('expired_product');
    } else if (d.includes('dirty') || d.includes('hygiene') || d.includes('smell')) {
      setAiSuggestion('unhygienic_premises');
    } else if (d.includes('adulter') || d.includes('fake') || d.includes('mixed')) {
      setAiSuggestion('adulteration');
    } else if (d.includes('label') || d.includes('mislead')) {
      setAiSuggestion('mislabeling');
    } else if (d.includes('cockroach') || d.includes('rat') || d.includes('insect') || d.includes('pest')) {
      setAiSuggestion('pest_contamination');
    } else {
      setAiSuggestion('');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant photo library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: 5 - evidence.length,
      });
      if (!result.canceled) {
        setEvidence((prev) => [...prev, ...result.assets].slice(0, 5));
      }
    } catch (_) { }
  };

  const detectLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant location permission.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      update('lat', loc.coords.latitude.toFixed(4));
      update('lng', loc.coords.longitude.toFixed(4));
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo) {
        const fullAddr = `${geo.name || geo.street || ''} ${geo.subregion || geo.city || ''}, ${geo.district || ''}, ${geo.region || ''}`.trim();
        update('address', fullAddr || 'Current Location');
        
        // Find best matching Maharashtra district
        const geoText = `${geo.district || ''} ${geo.subregion || ''} ${geo.city || ''} ${geo.region || ''}`.toLowerCase();
        const matchedDistrict = MAHARASHTRA_DISTRICTS.find((d) =>
          geoText.includes(d.toLowerCase())
        );

        const currentDistrict = matchedDistrict || geo.district || form.district || 'Mumbai Suburban';
        update('district', currentDistrict);

        // Find best matching taluka in this district
        const availableTalukas = MAHARASHTRA_TALUKAS[currentDistrict] || [];
        const matchedTaluka = availableTalukas.find((t) =>
          `${geo.name || ''} ${geo.street || ''} ${geo.subregion || ''} ${geo.city || ''}`.toLowerCase().includes(t.toLowerCase())
        );
        if (matchedTaluka) {
          update('taluka', matchedTaluka);
        } else if (availableTalukas.length > 0 && !form.taluka) {
          update('taluka', availableTalukas[0]);
        }

        Alert.alert('Live Location Detected', `${fullAddr}\nDistrict: ${currentDistrict}${matchedTaluka ? `\nTaluka: ${matchedTaluka}` : ''}\n(Coordinates: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)})`);
      }
    } catch {
      Alert.alert('Location Detect', 'Unable to detect automatically. Using current pin.');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Strict Duplicate Check before creation
      try {
        const dupRes = await complaintsAPI.checkDuplicates({
          category: form.category,
          description: form.description,
          district: form.district,
          taluka: form.taluka,
          vendorName: form.vendorName,
        });
        if (dupRes.data?.matches && dupRes.data.matches.length > 0) {
          const strongDup = dupRes.data.matches.find((m: any) => m.strength === 'strong');
          if (strongDup) {
            setLoading(false);
            Alert.alert(
              'Duplicate Complaint Detected',
              `An active food safety report for vendor "${strongDup.vendorName || form.vendorName}" has already been filed in ${strongDup.district || form.district} under tracking code ${strongDup.trackingCode}.\n\nTo prevent redundant reports, you can view and upvote the existing complaint.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'View Existing & Upvote',
                  onPress: () => {
                    if (navigation) {
                      navigation.navigate('Track', { initialCode: strongDup.trackingCode });
                    }
                  },
                },
              ]
            );
            return;
          }
        }
      } catch (_) { }

      // 2. Submit complaint with District and Taluka
      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('description', form.description);
      formData.append('vendorName', form.vendorName || 'Unspecified Vendor');
      formData.append('district', form.district);
      formData.append('taluka', form.taluka || '');
      formData.append('address', form.address || `${form.taluka ? `${form.taluka}, ` : ''}${form.district}`);
      formData.append('lat', form.lat);
      formData.append('lng', form.lng);
      formData.append('anonymous', String(form.anonymous));
      if (!form.anonymous) {
        formData.append('complainantName', form.complainantName || user?.name || 'Citizen');
        formData.append('complainantPhone', form.complainantPhone || user?.phone || '');
      }

      evidence.forEach((item, idx) => {
        formData.append('evidence', {
          uri: item.uri,
          name: `evidence_${idx}.jpg`,
          type: 'image/jpeg',
        } as any);
      });

      const { data } = await complaintsAPI.submit(formData);
      Alert.alert(
        'Complaint Submitted Successfully',
        `Your official FSSAI tracking code is: ${data.trackingCode}\nDistrict: ${form.district}\nTaluka: ${form.taluka || 'N/A'}\n\nYou can track the investigation progress anytime using this code.`,
        [
          {
            text: 'Track Status Now',
            onPress: () => {
              if (navigation) navigation.navigate('Track', { initialCode: data.trackingCode });
            },
          },
        ]
      );
    } catch (err: any) {
      if (err?.response?.data?.duplicate) {
        Alert.alert(
          'Duplicate Complaint',
          err.response.data.message || 'A complaint for this vendor already exists in this location.',
          [
            { text: 'OK' },
            {
              text: 'Track Existing',
              onPress: () => {
                if (navigation && err.response.data.existingTrackingCode) {
                  navigation.navigate('Track', { initialCode: err.response.data.existingTrackingCode });
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Submission Error', err?.response?.data?.message || 'Could not submit complaint. Please check your backend connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      {/* Header matching Screen 7, 8, 9, 10 */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => {
            if (step > 0) setStep(step - 1);
            else if (onBack) onBack();
            else if (navigation) navigation.goBack();
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Report Complaint</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Stepper matching reference: 1 - 2 - 3 - 4 with green dots and lines */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepRow}>
          {[1, 2, 3, 4].map((s, idx) => {
            const isCompleted = idx < step;
            const isCurrent = idx === step;
            return (
              <React.Fragment key={s}>
                <View
                  style={[
                    styles.stepCircle,
                    isCompleted || isCurrent ? styles.stepCircleActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      isCompleted || isCurrent ? styles.stepNumberActive : null,
                    ]}
                  >
                    {s}
                  </Text>
                </View>
                {idx < 3 && (
                  <View
                    style={[
                      styles.stepLine,
                      idx < step ? styles.stepLineActive : null,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
        <Text style={styles.stepTitle}>{STEPS[step]}</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* STEP 1: Issue Details (Screen 7) */}
        {step === 0 && (
          <View>
            <Text style={styles.fieldLabel}>Select Category</Text>
            <View style={styles.categoryGrid}>
              {COMPLAINT_CATEGORIES.map((cat) => {
                const selected = form.category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryBox, selected && styles.categoryBoxSelected]}
                    onPress={() => update('category', cat.id)}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryBoxText,
                        selected && styles.categoryBoxTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* AI Suggestion Box */}
            {aiSuggestion && aiSuggestion !== form.category && (
              <View style={styles.aiBox}>
                <Text style={styles.aiTitle}>⚠️ AI Suggestion</Text>
                <Text style={styles.aiDesc}>
                  Based on your description, this seems like{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {COMPLAINT_CATEGORIES.find((c) => c.id === aiSuggestion)?.label}
                  </Text>{' '}
                  (80% match)
                </Text>
                <TouchableOpacity
                  style={styles.aiApplyBtn}
                  onPress={() => update('category', aiSuggestion)}
                >
                  <Text style={styles.aiApplyText}>Use This Category</Text>
                </TouchableOpacity>
              </View>
            )}

            <Input
              label="Description"
              placeholder="Describe the issue..."
              value={form.description}
              onChangeText={(v) => {
                update('description', v);
                checkAiSuggestion(v);
              }}
              multiline
              numberOfLines={4}
              style={{ minHeight: 90, textAlignVertical: 'top' }}
            />

            <Input
              label="Vendor / Shop Name"
              placeholder="Enter vendor name"
              value={form.vendorName}
              onChangeText={(v) => update('vendorName', v)}
            />
          </View>
        )}

        {/* STEP 2: Location & Evidence (Screen 8) */}
        {/* STEP 2: Location & Evidence (Screen 8) */}
        {step === 1 && (
          <View>
            <TouchableOpacity style={styles.detectBtn} onPress={detectLocation}>
              <Text style={styles.detectBtnText}>📍 Detect Current Location (Auto-fills District/Taluka)</Text>
            </TouchableOpacity>

            {/* District & Taluka Selectors */}
            <View style={styles.pickerSection}>
              <Text style={styles.fieldLabel}>District *</Text>
              <TouchableOpacity
                style={styles.selectCard}
                onPress={() => {
                  setDistrictSearch('');
                  setShowDistrictModal(true);
                }}
              >
                <View style={styles.selectCardContent}>
                  <Text style={styles.selectCardIcon}>🏛️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectCardLabel}>Selected District</Text>
                    <Text style={styles.selectCardValue}>{form.district || 'Select District'}</Text>
                  </View>
                  <Text style={styles.selectCardArrow}>▼</Text>
                </View>
              </TouchableOpacity>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Taluka / Sub-Division *</Text>
              <TouchableOpacity
                style={styles.selectCard}
                onPress={() => {
                  setTalukaSearch('');
                  setShowTalukaModal(true);
                }}
              >
                <View style={styles.selectCardContent}>
                  <Text style={styles.selectCardIcon}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectCardLabel}>Selected Taluka ({form.district})</Text>
                    <Text style={styles.selectCardValue}>{form.taluka || 'Select Taluka'}</Text>
                  </View>
                  <Text style={styles.selectCardArrow}>▼</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Input
              label="Specific Street / Landmark Address"
              placeholder="e.g. Near Station Road, Opp Central Bank"
              value={form.address}
              onChangeText={(v) => update('address', v)}
            />

            {/* Map Placeholder matching Screen 8 */}
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPin}>📍</Text>
              <View style={styles.mapBadge}>
                <Text style={styles.mapBadgeText}>{form.taluka ? `${form.taluka}, ${form.district}` : form.district}</Text>
              </View>
            </View>

            <View style={styles.coordsRow}>
              <View style={styles.coordBox}>
                <Text style={styles.coordLabel}>Latitude</Text>
                <Text style={styles.coordVal}>{form.lat}</Text>
              </View>
              <View style={styles.coordBox}>
                <Text style={styles.coordLabel}>Longitude</Text>
                <Text style={styles.coordVal}>{form.lng}</Text>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Upload Photos / Videos (Max 5)</Text>
            <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
              <Text style={styles.uploadIcon}>☁️</Text>
              <Text style={styles.uploadText}>Tap to upload</Text>
              <Text style={styles.uploadSub}>Photos or Videos</Text>
            </TouchableOpacity>

            {evidence.length > 0 && (
              <View style={styles.thumbRow}>
                {evidence.map((item, idx) => (
                  <Image key={idx} source={{ uri: item.uri }} style={styles.thumbImg} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* STEP 3: Contact Details (Screen 9) */}
        {step === 2 && (
          <View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Report Anonymously</Text>
              <Switch
                value={form.anonymous}
                onValueChange={(v) => update('anonymous', v)}
                trackColor={{ true: '#0F4C3A' }}
              />
            </View>

            {!form.anonymous && (
              <>
                <Input
                  label="Name"
                  placeholder="Enter your name"
                  value={form.complainantName}
                  onChangeText={(v) => update('complainantName', v)}
                />

                <Input
                  label="Mobile Number"
                  placeholder="Enter number"
                  value={form.complainantPhone}
                  onChangeText={(v) => update('complainantPhone', v)}
                  keyboardType="phone-pad"
                  leftIcon={<Text style={{ fontWeight: '700', color: '#1E293B' }}>+91 </Text>}
                />
              </>
            )}

            <Text style={styles.fieldLabel}>Preferred Language</Text>
            <View style={styles.pickerBox}>
              <Text style={styles.pickerText}>{form.preferredLanguage}</Text>
              <Text style={styles.pickerArrow}>▾</Text>
            </View>

            <TouchableOpacity
              style={styles.checkboxOption}
              onPress={() => update('receivesSms', !form.receivesSms)}
            >
              <View style={[styles.checkSquare, form.receivesSms && styles.checkSquareActive]}>
                {form.receivesSms && <Text style={styles.whiteCheck}>✓</Text>}
              </View>
              <Text style={styles.checkOptionText}>Receive SMS updates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxOption}
              onPress={() => update('receivesWhatsapp', !form.receivesWhatsapp)}
            >
              <View style={[styles.checkSquare, form.receivesWhatsapp && styles.checkSquareActive]}>
                {form.receivesWhatsapp && <Text style={styles.whiteCheck}>✓</Text>}
              </View>
              <Text style={styles.checkOptionText}>Receive WhatsApp updates</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: Review & Submit (Screen 10) */}
        {step === 3 && (
          <View>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewSub}>Please review your information before submitting.</Text>
              <TouchableOpacity onPress={() => setStep(0)}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reviewList}>
              {[
                { icon: '🏷️', label: 'Category', val: COMPLAINT_CATEGORIES.find((c) => c.id === form.category)?.label || 'Expired Product' },
                { icon: '📝', label: 'Description', val: form.description || 'Food safety issue reported...' },
                { icon: '🏪', label: 'Vendor', val: form.vendorName || 'Unspecified Vendor' },
                { icon: '🏛️', label: 'District & Taluka', val: `${form.district}${form.taluka ? ` (Taluka: ${form.taluka})` : ''}` },
                { icon: '📍', label: 'Address & Coordinates', val: `${form.address || form.district} (${form.lat}, ${form.lng})` },
                { icon: '📷', label: 'Evidence', val: `${evidence.length} photos attached` },
                {
                  icon: '👤',
                  label: 'Contact',
                  val: form.anonymous ? 'Anonymous' : `${form.complainantName || user?.name || 'Citizen'}\n+91 ${form.complainantPhone || '98765 43210'}`,
                },
              ].map((row) => (
                <View key={row.label} style={styles.reviewRow}>
                  <Text style={styles.reviewIcon}>{row.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewLabel}>{row.label}</Text>
                    <Text style={styles.reviewVal}>{row.val}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Button */}
        <View style={styles.bottomBar}>
          {step < 3 ? (
            <Button
              title="Next →"
              onPress={() => {
                if (step === 0 && (!form.category || form.description.length <= 5)) {
                  Alert.alert('Incomplete Details', 'Please choose a category and enter a brief description.');
                  return;
                }
                if (step === 1 && !form.district) {
                  Alert.alert('District Required', 'Please select your District to proceed.');
                  return;
                }
                setStep(step + 1);
              }}
              fullWidth
              size="lg"
            />
          ) : (
            <Button
              title="Submit Complaint"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />
          )}
        </View>
      </ScrollView>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select District</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="🔍 Search district..."
              placeholderTextColor="#94A3B8"
              value={districtSearch}
              onChangeText={setDistrictSearch}
            />

            <ScrollView style={styles.modalList}>
              {MAHARASHTRA_DISTRICTS.filter((d) =>
                d.toLowerCase().includes(districtSearch.toLowerCase())
              ).map((d) => {
                const isSelected = form.district === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      update('district', d);
                      const talukas = MAHARASHTRA_TALUKAS[d] || [];
                      if (talukas.length > 0) {
                        update('taluka', talukas[0]);
                      } else {
                        update('taluka', '');
                      }
                      setShowDistrictModal(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {d}
                    </Text>
                    {isSelected && <Text style={styles.modalCheckMark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Taluka Selection Modal */}
      <Modal
        visible={showTalukaModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTalukaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Taluka ({form.district})</Text>
              <TouchableOpacity onPress={() => setShowTalukaModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="🔍 Search taluka..."
              placeholderTextColor="#94A3B8"
              value={talukaSearch}
              onChangeText={setTalukaSearch}
            />

            <ScrollView style={styles.modalList}>
              {(MAHARASHTRA_TALUKAS[form.district] || ['Headquarters', 'Rural Area', 'Other'])
                .filter((t) => t.toLowerCase().includes(talukaSearch.toLowerCase()))
                .map((t) => {
                  const isSelected = form.taluka === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                      onPress={() => {
                        update('taluka', t);
                        setShowTalukaModal(false);
                      }}
                    >
                      <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                        {t}
                      </Text>
                      {isSelected && <Text style={styles.modalCheckMark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  topHeader: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 26, color: '#1E293B' },
  screenTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  stepperContainer: {
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '75%',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#0F4C3A',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#0F4C3A',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F4C3A',
    marginTop: 8,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryBox: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  categoryBoxSelected: {
    borderColor: '#0F4C3A',
    backgroundColor: '#EAF4F1',
  },
  categoryIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  categoryBoxText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  categoryBoxTextSelected: {
    color: '#0F4C3A',
    fontWeight: '800',
  },
  aiBox: {
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#854D0E',
    marginBottom: 2,
  },
  aiDesc: {
    fontSize: 12,
    color: '#713F12',
    lineHeight: 16,
  },
  aiApplyBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#0F4C3A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  aiApplyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  detectBtn: {
    backgroundColor: '#0F4C3A',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  detectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  pickerSection: {
    marginBottom: 16,
  },
  selectCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectCardIcon: {
    fontSize: 20,
  },
  selectCardLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  selectCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F4C3A',
    marginTop: 1,
  },
  selectCardArrow: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 'auto',
  },
  mapPlaceholder: {
    height: 120,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mapPin: { fontSize: 28 },
  mapBadge: {
    backgroundColor: '#0F4C3A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  mapBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  coordsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  coordBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coordLabel: { fontSize: 11, color: '#94A3B8' },
  coordVal: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  uploadArea: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  uploadIcon: { fontSize: 28, marginBottom: 4 },
  uploadText: { fontSize: 13, fontWeight: '700', color: '#0F4C3A' },
  uploadSub: { fontSize: 11, color: '#94A3B8' },
  thumbRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  thumbImg: { width: 56, height: 56, borderRadius: 8 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  switchLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  pickerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  pickerText: { fontSize: 14, color: '#1E293B' },
  pickerArrow: { fontSize: 14, color: '#94A3B8' },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  checkSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSquareActive: {
    borderColor: '#0F4C3A',
    backgroundColor: '#0F4C3A',
  },
  whiteCheck: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  checkOptionText: { fontSize: 13, color: '#334155' },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reviewSub: { fontSize: 12, color: '#64748B', flex: 1 },
  editText: { fontSize: 13, fontWeight: '700', color: '#0F4C3A' },
  reviewList: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  reviewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewIcon: { fontSize: 18 },
  reviewLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  reviewVal: { fontSize: 13, color: '#1E293B', fontWeight: '700', marginTop: 1 },
  bottomBar: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F4C3A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },
  modalSearchInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 12,
  },
  modalList: {
    maxHeight: 350,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemSelected: {
    backgroundColor: '#EAF4F1',
    borderRadius: 8,
  },
  modalItemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  modalItemTextSelected: {
    color: '#0F4C3A',
    fontWeight: '700',
  },
  modalCheckMark: {
    color: '#0F4C3A',
    fontSize: 16,
    fontWeight: '800',
  },
});
