import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CAR_LOGOS from "@/constants/carLogos";
import skaftinClient from "@/backend/client/SkaftinClient";
import routes from "@/constants/ApiRoutes";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

type Step = "make" | "year" | "model" | "trim";

type Make = { id: number; make_id: string; make_name: string; make_slug: string; country_of_origin?: string };
type Model = { id: number; model_id: string; make_id: string; model_name: string; model_year: number };
type Trim = { id: number; trim_name: string };

const STEP_ORDER: Step[] = ["make", "year", "model", "trim"];
const STEP_LABELS: Record<Step, string> = {
  make: "Make",
  year: "Year",
  model: "Model",
  trim: "Trim",
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (make: string, model: string, year: number, trim: string) => void;
}

export default function VehiclePickerModal({ visible, onClose, onConfirm }: Props) {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("make");
  const [selectedMakeUuid, setSelectedMakeUuid] = useState("");
  const [selectedMakeSlug, setSelectedMakeSlug] = useState("");
  const [selectedMakeName, setSelectedMakeName] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedModelUuid, setSelectedModelUuid] = useState("");
  const [selectedModelName, setSelectedModelName] = useState("");
  const [search, setSearch] = useState("");
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [trims, setTrims] = useState<Trim[]>([]);
  const [loading, setLoading] = useState(false);
  const makesLoadedRef = useRef(false);
  const searchRef = useRef<TextInput>(null);

  // Fetch makes once on first open
  useEffect(() => {
    if (!visible || makesLoadedRef.current) return;
    let cancelled = false;
    setLoading(true);
    skaftinClient.post<Make[]>(routes.catalog.makes, {})
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data ?? []) as any[];
        setMakes(rows.sort((a, b) => a.make_name.localeCompare(b.make_name)));
        makesLoadedRef.current = true;
      })
      .catch(() => { /* leave empty */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible]);

  const stepIndex = STEP_ORDER.indexOf(step);

  // Derive unique years from loaded models, sorted newest first
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const m of models) set.add(m.model_year);
    return Array.from(set).sort((a, b) => b - a);
  }, [models]);

  const filteredMakes = useMemo(() => {
    const q = search.toLowerCase();
    return makes.filter(
      (m) =>
        m.make_name.toLowerCase().includes(q) ||
        (m.country_of_origin ?? "").toLowerCase().includes(q)
    );
  }, [makes, search]);

  const filteredYears = useMemo(
    () => (search ? years.filter((y) => y.toString().startsWith(search)) : years),
    [search, years]
  );

  const filteredModels = useMemo(() => {
    if (!selectedYear) return [];
    const byYear = models
      .filter((m) => m.model_year === selectedYear)
      .sort((a, b) => a.model_name.localeCompare(b.model_name));
    const q = search.toLowerCase();
    return q ? byYear.filter((m) => m.model_name.toLowerCase().includes(q)) : byYear;
  }, [search, selectedYear, models]);

  const filteredTrims = useMemo(() => {
    const names = trims
      .map((t) => {
        const n = t.trim_name.trim();
        return n && n !== "-" ? n : "Base";
      })
      .sort((a, b) => a.localeCompare(b));
    const unique = Array.from(new Set(names.length > 0 ? names : ["Base"]));
    const q = search.toLowerCase();
    return q ? unique.filter((t) => t.toLowerCase().includes(q)) : unique;
  }, [search, trims]);

  const resetAndClose = useCallback(() => {
    setStep("make");
    setSelectedMakeUuid("");
    setSelectedMakeSlug("");
    setSelectedMakeName("");
    setSelectedYear(null);
    setSelectedModelUuid("");
    setSelectedModelName("");
    setModels([]);
    setTrims([]);
    setSearch("");
    onClose();
  }, [onClose]);

  const handleMakeSelect = useCallback((make: Make) => {
    setSelectedMakeUuid(make.make_id);
    setSelectedMakeSlug(make.make_slug);
    setSelectedMakeName(make.make_name);
    setSelectedYear(null);
    setSelectedModelUuid("");
    setSelectedModelName("");
    setModels([]);
    setTrims([]);
    setSearch("");
    setStep("year");
    // Fetch all models for this make
    setLoading(true);
    skaftinClient.post<Model[]>(routes.catalog.models, { where: { make_id: make.make_id } })
      .then((res) => {
        setModels((res.data ?? []) as any[]);
      })
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, []);

  const handleYearSelect = useCallback((year: number) => {
    setSelectedYear(year);
    setSelectedModelUuid("");
    setSelectedModelName("");
    setSearch("");
    setStep("model");
  }, []);

  const handleModelSelect = useCallback((model: Model) => {
    setSelectedModelUuid(model.model_id);
    setSelectedModelName(model.model_name);
    setTrims([]);
    setSearch("");
    setStep("trim");
    // Fetch trims for this model
    setLoading(true);
    skaftinClient.post<Trim[]>(routes.catalog.trims, { where: { model_id: model.model_id } })
      .then((res) => {
        setTrims((res.data ?? []) as any[]);
      })
      .catch(() => setTrims([]))
      .finally(() => setLoading(false));
  }, []);

  const handleTrimSelect = useCallback(
    (trim: string) => {
      Keyboard.dismiss();
      onConfirm(selectedMakeName, selectedModelName, selectedYear!, trim);
      resetAndClose();
    },
    [selectedMakeName, selectedModelName, selectedYear, onConfirm, resetAndClose]
  );

  const handleBack = useCallback(() => {
    setSearch("");
    if (step === "year") setStep("make");
    else if (step === "model") setStep("year");
    else if (step === "trim") setStep("model");
  }, [step]);

  const renderMakeItem = useCallback(
    ({ item }: { item: Make }) => {
      const logo = CAR_LOGOS[item.make_slug];
      return (
        <TouchableOpacity
          style={styles.item}
          onPress={() => handleMakeSelect(item)}
          activeOpacity={0.65}
        >
          <View style={styles.makeLogoWrap}>
            {logo ? (
              <Image source={logo} style={styles.makeLogo} resizeMode="contain" />
            ) : (
              <Text style={styles.makeInitialText}>{item.make_name.charAt(0)}</Text>
            )}
          </View>
          <View style={styles.itemTextBlock}>
            <Text style={styles.itemPrimary}>{item.make_name}</Text>
            <Text style={styles.itemSecondary}>{item.country_of_origin || "Unknown"}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={C.textSubtle} />
        </TouchableOpacity>
      );
    },
    [handleMakeSelect]
  );

  const renderYearItem = useCallback(
    ({ item }: { item: number }) => (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleYearSelect(item)}
        activeOpacity={0.65}
      >
        <Text style={styles.yearText}>{item}</Text>
      </TouchableOpacity>
    ),
    [handleYearSelect]
  );

  const renderModelItem = useCallback(
    ({ item }: { item: Model }) => (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleModelSelect(item)}
        activeOpacity={0.65}
      >
        <View style={styles.itemTextBlock}>
          <Text style={styles.itemPrimary}>{item.model_name}</Text>
        </View>
        <Feather name="chevron-right" size={16} color={C.textSubtle} />
      </TouchableOpacity>
    ),
    [handleModelSelect]
  );

  const renderTrimItem = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleTrimSelect(item)}
        activeOpacity={0.65}
      >
        <View style={styles.itemTextBlock}>
          <Text style={styles.itemPrimary}>{item}</Text>
        </View>
        <Feather name="check" size={16} color={C.tint} />
      </TouchableOpacity>
    ),
    [handleTrimSelect]
  );

  const listData: any[] =
    step === "make"
      ? filteredMakes
      : step === "year"
      ? filteredYears
      : step === "model"
      ? filteredModels
      : filteredTrims;
  const renderItem =
    step === "make"
      ? renderMakeItem
      : step === "year"
      ? (renderYearItem as any)
      : step === "model"
      ? (renderModelItem as any)
      : (renderTrimItem as any);

  const title =
    step === "make"
      ? "Select Make"
      : step === "year"
      ? `${selectedMakeName} — Select Year`
      : step === "model"
      ? `${selectedMakeName} ${selectedYear} — Select Model`
      : `${selectedMakeName} ${selectedYear} ${selectedModelName} — Select Trim`;

  const searchPlaceholder =
    step === "make"
      ? "Search make or country..."
      : step === "year"
      ? "Search year..."
      : step === "model"
      ? "Search model..."
      : "Search trim...";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={stepIndex === 0 ? resetAndClose : handleBack}
    >
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={stepIndex === 0 ? resetAndClose : handleBack}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather
              name={stepIndex === 0 ? "x" : "arrow-left"}
              size={20}
              color={C.text}
            />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.stepRow}>
          {STEP_ORDER.map((s, i) => (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    i < stepIndex && styles.stepDotDone,
                    i === stepIndex && styles.stepDotActive,
                  ]}
                >
                  {i < stepIndex ? (
                    <Feather name="check" size={10} color={C.background} />
                  ) : (
                    <Text
                      style={[
                        styles.stepDotNum,
                        i === stepIndex && styles.stepDotNumActive,
                      ]}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    i === stepIndex && styles.stepLabelActive,
                  ]}
                >
                  {STEP_LABELS[s]}
                </Text>
              </View>
              {i < STEP_ORDER.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    i < stepIndex && styles.stepLineDone,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        {selectedMakeName ? (
          <View style={styles.breadcrumb}>
            {CAR_LOGOS[selectedMakeSlug] ? (
              <Image
                source={CAR_LOGOS[selectedMakeSlug] as any}
                style={styles.breadcrumbLogo}
                resizeMode="contain"
              />
            ) : null}
            <Text style={styles.breadcrumbText}>{selectedMakeName}</Text>
            {selectedYear ? (
              <>
                <Feather name="chevron-right" size={11} color={C.textSubtle} />
                <Text style={styles.breadcrumbText}>{selectedYear}</Text>
              </>
            ) : null}
            {selectedModelName ? (
              <>
                <Feather name="chevron-right" size={11} color={C.textSubtle} />
                <Text style={styles.breadcrumbText}>{selectedModelName}</Text>
              </>
            ) : null}
          </View>
        ) : null}

        <View style={styles.searchWrap}>
          <Feather name="search" size={15} color={C.textMuted} style={styles.searchIcon} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={searchPlaceholder}
            placeholderTextColor={C.textMuted}
            keyboardType={step === "year" ? "numeric" : "default"}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x-circle" size={15} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={C.tint} />
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item) =>
              step === "make"
                ? String((item as Make).id)
                : step === "model"
                ? String((item as Model).id)
                : String(item)
            }
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Feather name="search" size={28} color={C.textSubtle} />
                <Text style={styles.emptyText}>
                  {search ? `No results for "${search}"` : "Nothing found"}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: C.surface,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.surfaceBorder,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    textAlign: "center",
    marginHorizontal: 4,
  },

  // Step indicator
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  stepDotActive: {
    borderColor: C.tint,
    backgroundColor: "transparent",
  },
  stepDotDone: {
    backgroundColor: C.tint,
    borderColor: C.tint,
  },
  stepDotNum: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.textMuted,
  },
  stepDotNumActive: {
    color: C.tint,
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    letterSpacing: 0.4,
  },
  stepLabelActive: {
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.surfaceBorder,
    marginBottom: 14,
    marginHorizontal: 6,
    minWidth: 24,
  },
  stepLineDone: {
    backgroundColor: C.tint,
  },

  // Breadcrumb
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  breadcrumbLogo: {
    width: 18,
    height: 18,
  },
  breadcrumbText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
  },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceElevated,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    gap: 8,
  },
  searchIcon: {
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.text,
    padding: 0,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: C.surfaceElevated,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    gap: 12,
  },
  makeLogoWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  makeLogo: {
    width: 30,
    height: 30,
  },
  makeInitialText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: C.tint,
  },
  itemTextBlock: {
    flex: 1,
  },
  itemPrimary: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  itemSecondary: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: 1,
  },
  yearText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: C.text,
    paddingLeft: 4,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
  },
  emptyWrap: {
    paddingTop: 48,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
  },
});
