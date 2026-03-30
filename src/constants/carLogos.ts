// Static mapping of vehicle make IDs → logo image requires.
// React Native requires static require() calls — they cannot be dynamic.
const CAR_LOGOS: Record<string, any> = {
  audi:        require("../../assets/carLogos/audi-logo-2016.png"),
  bmw:         require("../../assets/carLogos/bmw-logo-2020.png"),
  mercedes:    require("../../assets/carLogos/Mercedes-Benz-logo-2011.png"),
  volkswagen:  require("../../assets/carLogos/Volkswagen-logo-2019.png"),
  opel:        require("../../assets/carLogos/Opel-logo-2009.png"),
  porsche:     require("../../assets/carLogos/porsche-logo-2014.png"),
  toyota:      require("../../assets/carLogos/toyota-logo-2020.png"),
  honda:       require("../../assets/carLogos/honda-logo-2000.png"),
  nissan:      require("../../assets/carLogos/nissan-logo-2020.png"),
  mazda:       require("../../assets/carLogos/mazda-logo-2018.png"),
  suzuki:      require("../../assets/carLogos/Suzuki-logo.png"),
  subaru:      require("../../assets/carLogos/subaru-logo-2019.png"),
  isuzu:       require("../../assets/carLogos/Isuzu-logo-1991.png"),
  lexus:       require("../../assets/carLogos/Lexus-symbol-1988.png"),
  hyundai:     require("../../assets/carLogos/hyundai-logo-2011.png"),
  kia:         require("../../assets/carLogos/Kia-logo.png"),
  ford:        require("../../assets/carLogos/ford-logo-2017-640.png"),
  chevrolet:   require("../../assets/carLogos/Chevrolet-logo-2013.png"),
  jeep:        require("../../assets/carLogos/jeep-logo-1993.png"),
  dodge:       require("../../assets/carLogos/dodge-logo-2010.png"),
  renault:     require("../../assets/carLogos/Renault-logo-2015.png"),
  peugeot:     require("../../assets/carLogos/Peugeot-logo-2010.png"),
  citroen:     require("../../assets/carLogos/Citroen-logo-2009.png"),
  volvo:       require("../../assets/carLogos/Volvo-logo-2014.png"),
  jaguar:      require("../../assets/carLogos/jaguar-logo-2021.png"),
  mini:        require("../../assets/carLogos/Mini-logo-2001.png"),
  haval:       require("../../assets/carLogos/Haval-logo.png"),
  fiat:        require("../../assets/carLogos/Fiat-logo-2006.png"),
  alfa:        require("../../assets/carLogos/Alfa-Romeo-logo-2015.png"),
};

export default CAR_LOGOS;

// Map display names (as stored on Vehicle.make) → logo.
// Handles names that don't simplify to their ID via toLowerCase().
const NAME_OVERRIDES: Record<string, any> = {
  "mercedes-benz": CAR_LOGOS.mercedes,
  "land rover":    CAR_LOGOS.landrover,
  "alfa romeo":    CAR_LOGOS.alfa,
  "alfa":          CAR_LOGOS.alfa,
};

export function getCarLogo(makeName: string): any {
  if (!makeName) return null;
  const key = makeName.toLowerCase();
  return NAME_OVERRIDES[key] ?? CAR_LOGOS[key] ?? null;
}
