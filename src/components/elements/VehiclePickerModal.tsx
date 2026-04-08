import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import skaftinClient from "@/backend/client/SkaftinClient";
import routes from "@/constants/ApiRoutes";
import vehicleMakesData from "../../../assets/json/vehicleMakes.json";
import vehicleModelsData from "../../../assets/json/vehicleModels.json";
import vehicleTrimsData from "../../../assets/json/vehicleTrims.json";

const C = Colors.dark;

type Step = "make" | "year" | "model" | "trim";

type Make = { makeId: string; makeName: string; makeSlug: string; countryOfOrigin?: string };
type Model = { modelId: string; makeId: string; modelName: string; modelSlug: string; modelYear: number };
type Trim = { trimId: string; modelId: string; trimName: string; trimSlug: string };

const STATIC_MAKES: Make[] = vehicleMakesData as Make[];
const STATIC_MODELS: Model[] = vehicleModelsData as Model[];
const STATIC_TRIMS: Trim[] = vehicleTrimsData as Trim[];

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
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("make");
  const [selectedMakeId, setSelectedMakeId] = useState("");
  const [selectedMakeSlug, setSelectedMakeSlug] = useState("");
  const [selectedMakeName, setSelectedMakeName] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedModelName, setSelectedModelName] = useState("");
  const [search, setSearch] = useState("");
  const [makes, setMakes] = useState<Make[]>(STATIC_MAKES);
  const [models, setModels] = useState<Model[]>(STATIC_MODELS);
  const [trims, setTrims] = useState<Trim[]>(STATIC_TRIMS);
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    let cancelled = false;
    const loadCatalog = async () => {
      if (!visible) return;
      try {
        const [makesRes, modelsRes, trimsRes] = await Promise.all([
          skaftinClient.get<any[]>(routes.catalog.makes),
          skaftinClient.get<any[]>(routes.catalog.models),
          skaftinClient.get<any[]>(routes.catalog.trims),
        ]);

        const remoteMakes = (makesRes.data ?? []).map((row) => ({
          makeId: String(row.make_id ?? ""),
          makeName: String(row.make_name ?? ""),
          makeSlug: String(row.make_slug ?? ""),
          countryOfOrigin: row.country_of_origin ? String(row.country_of_origin) : "",
        }));
        const remoteModels = (modelsRes.data ?? []).map((row) => ({
          modelId: String(row.model_id ?? ""),
          makeId: String(row.make_id ?? ""),
          modelName: String(row.model_name ?? ""),
          modelSlug: String(row.model_slug ?? ""),
          modelYear: Number(row.model_year),
        }));
        const remoteTrims = (trimsRes.data ?? []).map((row) => ({
          trimId: String(row.trim_id ?? ""),
          modelId: String(row.model_id ?? ""),
          trimName: String(row.trim_name ?? ""),
          trimSlug: String(row.trim_slug ?? ""),
        }));

        if (cancelled) return;
        setMakes(remoteMakes.length > 0 ? remoteMakes : STATIC_MAKES);
        setModels(remoteModels.length > 0 ? remoteModels : STATIC_MODELS);
        setTrims(remoteTrims.length > 0 ? remoteTrims : STATIC_TRIMS);
      } catch {
        if (cancelled) return;
        // Keep picker usable when backend is temporarily unavailable.
        setMakes(STATIC_MAKES);
        setModels(STATIC_MODELS);
        setTrims(STATIC_TRIMS);
      }
    };

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const stepIndex = STEP_ORDER.indexOf(step);

  const yearsByMakeId = useMemo(() => {
    const byMake = new Map<string, Set<number>>();

    for (const model of models) {
      if (!byMake.has(model.makeId)) byMake.set(model.makeId, new Set<number>());
      byMake.get(model.makeId)?.add(model.modelYear);
    }

    return byMake;
  }, [models]);

  const modelsByMakeIdAndYear = useMemo(() => {
    const byKey = new Map<string, Model[]>();

    for (const model of models) {
      const key = `${model.makeId}|${model.modelYear}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)?.push(model);
    }

    return byKey;
  }, [models]);

  const trimNamesByModelId = useMemo(() => {
    const byModel = new Map<string, Set<string>>();

    for (const trim of trims) {
      const normalizedName = trim.trimName.trim();
      const safeTrimName = normalizedName && normalizedName !== "-" ? normalizedName : "Base";
      if (!byModel.has(trim.modelId)) byModel.set(trim.modelId, new Set<string>());
      byModel.get(trim.modelId)?.add(safeTrimName);
    }

    return byModel;
  }, [trims]);

  const filteredMakes = useMemo(() => {
    const q = search.toLowerCase();
    return makes.filter(
      (m) =>
        m.makeName.toLowerCase().includes(q) ||
        (m.countryOfOrigin || "").toLowerCase().includes(q)
    );
  }, [makes, search]);

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
    const models = [...(modelsByMakeIdAndYear.get(key) ?? [])].sort((a, b) =>
      a.modelName.localeCompare(b.modelName)
    );
    const q = search.toLowerCase();
    return models.filter((m) => m.modelName.toLowerCase().includes(q));
  }, [search, selectedMakeId, selectedYear, modelsByMakeIdAndYear]);

  const filteredTrims = useMemo(() => {
    if (!selectedModelId) return [];
    const trims = Array.from(trimNamesByModelId.get(selectedModelId) ?? []).sort((a, b) =>
      a.localeCompare(b)
    );
    const source = trims.length > 0 ? trims : ["Base"];
    const q = search.toLowerCase();
    return source.filter((t) => t.toLowerCase().includes(q));
  }, [search, selectedModelId, trimNamesByModelId]);

  const resetAndClose = useCallback(() => {
    setStep("make");
    setSelectedMakeId("");
    setSelectedMakeSlug("");
    setSelectedMakeName("");
    setSelectedYear(null);
    setSelectedModelId("");
    setSelectedModelName("");
    setSearch("");
    onClose();
  }, [onClose]);

  const handleMakeSelect = useCallback((make: Make) => {
    setSelectedMakeId(make.makeId);
    setSelectedMakeSlug(make.makeSlug);
    setSelectedMakeName(make.makeName);
    setSelectedYear(null);
    setSelectedModelId("");
    setSelectedModelName("");
    setSearch("");
    setStep("year");
  }, []);

  const handleYearSelect = useCallback((year: number) => {
    setSelectedYear(year);
    setSelectedModelId("");
    setSelectedModelName("");
    setSearch("");
    setStep("model");
  }, []);

  const handleModelSelect = useCallback((model: Model) => {
    setSelectedModelId(model.modelId);
    setSelectedModelName(model.modelName);
    setSearch("");
    setStep("trim");
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
    ({ item }: { item: Model }) => (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleModelSelect(item)}
        activeOpacity={0.65}
      >
        <View style={styles.itemTextBlock}>
          <Text style={styles.itemPrimary}>{item.modelName}</Text>
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

  const listData =
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

        <FlatList
          data={listData as any[]}
          keyExtractor={(item) =>
            step === "make"
              ? (item as Make).makeId
              : step === "model"
              ? (item as Model).modelId
              : String(item)
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
