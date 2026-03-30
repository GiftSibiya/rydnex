// Static mapping of vehicle make IDs → logo image requires.
// React Native requires static require() calls — they cannot be dynamic.
const CAR_LOGOS: Record<string, any> = {
  "abarth": require("../../assets/carLogos/abarth-logo.png"),
  "acura": require("../../assets/carLogos/acura-logo.png"),
  "alfa-romeo": require("../../assets/carLogos/alfa-romeo-logo-2015.png"),
  "audi": require("../../assets/carLogos/audi-logo-2016.png"),
  "baic": require("../../assets/carLogos/baic-motor-logo.png"),
  "bentley": require("../../assets/carLogos/bentley-logo-2002.png"),
  "bmw": require("../../assets/carLogos/bmw-logo-2020.png"),
  "bugatti": require("../../assets/carLogos/bugatti-logo.png"),
  "cadillac": require("../../assets/carLogos/cadillac-logo-2021.png"),
  "chery": require("../../assets/carLogos/chery-logo-2013.png"),
  "chrysler": require("../../assets/carLogos/chrysler-logo-2009.png"),
  "citroen": require("../../assets/carLogos/citroen-logo-2009.png"),
  "chevrolet": require("../../assets/carLogos/chevrolet-logo-2013.png"),
  "dodge": require("../../assets/carLogos/dodge-logo-2010.png"),
  "fiat": require("../../assets/carLogos/Fiat-logo-2006.png"),
  "ford": require("../../assets/carLogos/ford-logo-2017-640.png"),
  "gwm": require("../../assets/carLogos/gwm-logo-2007.png"),
  "haval": require("../../assets/carLogos/Haval-logo.png"),
  "honda": require("../../assets/carLogos/honda-logo-2000.png"),
  "hyundai": require("../../assets/carLogos/hyundai-logo-2011.png"),
  "isuzu": require("../../assets/carLogos/Isuzu-logo-1991.png"),
  "jaguar": require("../../assets/carLogos/jaguar-logo-2021.png"),
  "jeep": require("../../assets/carLogos/jeep-logo-1993.png"),
  "kia": require("../../assets/carLogos/Kia-logo.png"),
  "lexus": require("../../assets/carLogos/Lexus-symbol-1988.png"),
  "mazda": require("../../assets/carLogos/mazda-logo-2018.png"),
  "mercedes-benz": require("../../assets/carLogos/mercedes-benz-logo-2011.png"),
  "mini": require("../../assets/carLogos/Mini-logo-2001.png"),
  "nissan": require("../../assets/carLogos/nissan-logo-2020.png"),
  "opel": require("../../assets/carLogos/Opel-logo-2009.png"),
  "peugeot": require("../../assets/carLogos/Peugeot-logo-2010.png"),
  "porsche": require("../../assets/carLogos/porsche-logo-2014.png"),
  "renault": require("../../assets/carLogos/Renault-logo-2015.png"),
  "ssangyong": require("../../assets/carLogos/ssangyong-logo.png"),
  "suzuki": require("../../assets/carLogos/suzuki-logo.png"),
  "subaru": require("../../assets/carLogos/subaru-logo-2019.png"),
  "toyota": require("../../assets/carLogos/toyota-logo-2020.png"),
  "volkswagen": require("../../assets/carLogos/volkswagen-logo-2019.png"),
  "volvo": require("../../assets/carLogos/volvo-logo-2014.png"),
};

export default CAR_LOGOS;

// Map display names (as stored on Vehicle.make) → logo.
// Handles names that don't simplify to their ID via toLowerCase().
const NAME_OVERRIDES: Record<string, any> = {
  "mercedes-benz": CAR_LOGOS.mercedes,
  "land rover": CAR_LOGOS.landrover,
  "alfa romeo": CAR_LOGOS.alfa,
  "alfa": CAR_LOGOS.alfa,
};

export function getCarLogo(makeName: string): any {
  if (!makeName) return null;
  const key = makeName.toLowerCase();
  return NAME_OVERRIDES[key] ?? CAR_LOGOS[key] ?? null;
}
