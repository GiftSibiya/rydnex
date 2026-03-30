import { Feather } from "@expo/vector-icons";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
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
import Colors from "../../constants/colors";
import vehicleMakesData from "../../../assets/json/vehicleMakes.json";
import vehicleModelsData from "../../../assets/json/vehicleModels.json";

const C = Colors.dark;

// Step order: make → year → model
type Step = "make" | "year" | "model";

type Make = { makeId: string; makeName: string; makeSlug: string; countryOfOrigin?: string };
type Model = { modelId: string; makeId: string; modelName: string; modelSlug: string; modelYear: number };

const MAKES: Make[] = vehicleMakesData as Make[];
const MODELS: Model[] = vehicleModelsData as Model[];

const STEP_ORDER: Step[] = ["make", "year", "model"];
const STEP_LABELS: Record<Step, string> = {
  make: "Make",
  year: "Year",
  model: "Model",
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (make: string, model: string, year: number) => void;
}

export default function VehiclePickerModal({ visible, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("make");
  const [selectedMakeId, setSelectedMakeId] = useState("");
  const [selectedMakeSlug, setSelectedMakeSlug] = useState("");
  const [selectedMakeName, setSelectedMakeName] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const searchRef = useRef<TextInput>(null);

  const stepIndex = STEP_ORDER.indexOf(step);

  const yearsByMakeId = useMemo(() => {
    const byMake = new Map<string, Set<number>>();

    for (const model of MODELS) {
      if (!byMake.has(model.makeId)) byMake.set(model.makeId, new Set<number>());
      byMake.get(model.makeId)?.add(model.modelYear);
    }

    return byMake;
  }, []);

  const modelNamesByMakeIdAndYear = useMemo(() => {
    const byKey = new Map<string, Set<string>>();

    for (const model of MODELS) {
      const key = `${model.makeId}|${model.modelYear}`;
      if (!byKey.has(key)) byKey.set(key, new Set<string>());
      byKey.get(key)?.add(model.modelName);
    }

    return byKey;
  }, []);

  const filteredMakes = useMemo(() => {
    const q = search.toLowerCase();
    return MAKES.filter(
      (m) =>
        m.makeName.toLowerCase().includes(q) ||
        (m.countryOfOrigin || "").toLowerCase().includes(q)
    );
  }, [search]);

  const years = useMemo(() => {
    if (!selectedMakeId) return [];
    const list = Array.from(yearsByMakeId.get(selectedMakeId) ?? []);
    list.sort((a, b) => b - a);
    return list;
  }, [selectedMakeId, yearsByMakeId]);

  const filteredYears = useMemo(
    () => (search ? years.filter((y) => y.toString().startsWith(search)) : years),
    [search, years]
  );

  const filteredModels = useMemo(() => {
    if (!selectedMakeId || !selectedYear) return [];
    const key = `${selectedMakeId}|${selectedYear}`;
    const models = Array.from(modelNamesByMakeIdAndYear.get(key) ?? []).sort((a, b) =>
      a.localeCompare(b)
    );
    const q = search.toLowerCase();
    return models.filter((m) => m.toLowerCase().includes(q));
  }, [search, selectedMakeId, selectedYear, modelNamesByMakeIdAndYear]);

  const resetAndClose = useCallback(() => {
    setStep("make");
    setSelectedMakeId("");
    setSelectedMakeSlug("");
    setSelectedMakeName("");
    setSelectedYear(null);
    setSearch("");
    onClose();
  }, [onClose]);

  const handleMakeSelect = useCallback((make: Make) => {
    setSelectedMakeId(make.makeId);
    setSelectedMakeSlug(make.makeSlug);
    setSelectedMakeName(make.makeName);
    setSelectedYear(null);
    setSearch("");
    setStep("year");
  }, []);

  const handleYearSelect = useCallback((year: number) => {
    setSelectedYear(year);
    setSearch("");
    setStep("model");
  }, []);

  const handleModelSelect = useCallback(
    (model: string) => {
      Keyboard.dismiss();
      onConfirm(selectedMakeName, model, selectedYear!);
      resetAndClose();
    },
    [selectedMakeName, selectedYear, onConfirm, resetAndClose]
  );

  const handleBack = useCallback(() => {
    setSearch("");
    if (step === "year") setStep("make");
    else if (step === "model") setStep("year");
  }, [step]);

  const renderMakeItem = useCallback(
    ({ item }: { item: Make }) => {
      const logo = CAR_LOGOS[item.makeSlug];
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
              <Text style={styles.makeInitialText}>{item.makeName.charAt(0)}</Text>
            )}
          </View>
          <View style={styles.itemTextBlock}>
            <Text style={styles.itemPrimary}>{item.makeName}</Text>
            <Text style={styles.itemSecondary}>{item.countryOfOrigin || "Unknown"}</Text>
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
    ({ item }: { item: string }) => (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleModelSelect(item)}
        activeOpacity={0.65}
      >
        <View style={styles.itemTextBlock}>
          <Text style={styles.itemPrimary}>{item}</Text>
        </View>
        <Feather name="chevron-right" size={16} color={C.textSubtle} />
      </TouchableOpacity>
    ),
    [handleModelSelect]
  );

  const listData =
    step === "make" ? filteredMakes : step === "year" ? filteredYears : filteredModels;
  const renderItem =
    step === "make"
      ? renderMakeItem
      : step === "year"
      ? (renderYearItem as any)
      : renderModelItem;

  const title =
    step === "make"
      ? "Select Make"
      : step === "year"
      ? `${selectedMakeName} — Select Year`
      : `${selectedMakeName} ${selectedYear} — Select Model`;

  const searchPlaceholder =
    step === "make"
      ? "Search make or country..."
      : step === "year"
      ? "Search year..."
      : "Search model...";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={stepIndex === 0 ? resetAndClose : handleBack}
    >
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
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

        {/* Step indicator */}
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

        {/* Breadcrumb */}
        {selectedMakeName ? (
          <View style={styles.breadcrumb}>
            {CAR_LOGOS[selectedMakeSlug] ? (
              <Image
                source={CAR_LOGOS[selectedMakeSlug]}
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
          </View>
        ) : null}

        {/* Search */}
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

        {/* List */}
        <FlatList
          data={listData as any[]}
          keyExtractor={(item) =>
            typeof item === "object" ? (item as Make).makeId : String(item)
          }
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Feather name="search" size={28} color={C.textSubtle} />
              <Text style={styles.emptyText}>No results for "{search}"</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
