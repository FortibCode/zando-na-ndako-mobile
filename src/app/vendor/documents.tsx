import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, IdCard, Briefcase, FileBadge, Store, Plus } from 'lucide-react-native';
import { useVendor, type VendorDocument } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';

const DOC_ICONS: Record<string, any> = {
  "Carte d'identité": IdCard,
  RCOM: Briefcase,
  NIF: FileBadge,
  'Autorisation commerciale': Store,
};

function statusLabel(statut: VendorDocument['statut'], t: (key: string, fallback?: string) => string): string {
  if (statut === 'valide') return t('vendorDocuments.statusValid', 'Validé');
  if (statut === 'en_attente') return t('vendorDocuments.statusPending', 'En attente');
  return t('vendorDocuments.statusRefused', 'Refusé');
}

export default function VendorDocumentsScreen() {
  const { documents } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const STATUS_COLOR: Record<VendorDocument['statut'], string> = {
    valide: colors.success, en_attente: colors.warning, refuse: colors.error,
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorDocuments.title', 'Documents')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {documents.map((doc, i) => {
          const Icon = DOC_ICONS[doc.nom] || IdCard;
          return (
            <Animated.View key={doc.id} entering={FadeInUp.duration(350).delay(i * 60).springify()} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                <Icon color={colors.primary} size={20} />
              </View>
              <Text style={[styles.docName, { color: colors.text }]}>{doc.nom}</Text>
              <Text style={[styles.status, { color: STATUS_COLOR[doc.statut] }]}>{statusLabel(doc.statut, t)}</Text>
            </Animated.View>
          );
        })}

        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()}>
          <Pressable
            onPress={() => alert(t('vendorDocuments.addDocument', 'Ajouter un document'), t('vendorDocuments.addDocumentAlertDesc', 'Le téléversement de documents sera bientôt disponible.'))}
            style={[styles.addBtn, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}
          >
            <Plus color={colors.primary} size={18} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>{t('vendorDocuments.addDocument', 'Ajouter un document')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900' },
  content: { padding: 20, gap: 12, paddingBottom: 30 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 16,
    borderWidth: 1,
  },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: 15, fontWeight: '700', flex: 1 },
  status: { fontSize: 13.5, fontWeight: '900' },

  addBtn: {
    height: 56, borderRadius: 16, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 8,
  },
  addBtnText: { fontSize: 14.5, fontWeight: '800' },
});
