import { Request, Response, NextFunction } from 'express';

export const getDistricts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const districts = [
      // Toshkent shahri tumanlari
      { id: "toshkent-chilonzor",      name: "Chilonzor",       city: "Toshkent shahri" },
      { id: "toshkent-yunusobod",      name: "Yunusobod",       city: "Toshkent shahri" },
      { id: "toshkent-mirzo-ulugbek",  name: "Mirzo Ulug'bek",  city: "Toshkent shahri" },
      { id: "toshkent-shayxontohur",   name: "Shayxontohur",    city: "Toshkent shahri" },
      { id: "toshkent-olmazor",        name: "Olmazor",         city: "Toshkent shahri" },
      { id: "toshkent-uchtepa",        name: "Uchtepa",         city: "Toshkent shahri" },
      { id: "toshkent-yakkasaroy",     name: "Yakkasaroy",      city: "Toshkent shahri" },
      { id: "toshkent-sergeli",        name: "Sergeli",         city: "Toshkent shahri" },
      { id: "toshkent-bektemir",       name: "Bektemir",        city: "Toshkent shahri" },
      { id: "toshkent-mirobod",        name: "Mirobod",         city: "Toshkent shahri" },
      // Toshkent viloyati tumanlari
      { id: "toshvil-angren",          name: "Angren",          city: "Toshkent viloyati" },
      { id: "toshvil-bekabad",         name: "Bekabad",         city: "Toshkent viloyati" },
      { id: "toshvil-boka",            name: "Bo'ka",           city: "Toshkent viloyati" },
      { id: "toshvil-bostonliq",       name: "Bo'stonliq",      city: "Toshkent viloyati" },
      { id: "toshvil-chinoz",          name: "Chinoz",          city: "Toshkent viloyati" },
      { id: "toshvil-chirchiq",        name: "Chirchiq",        city: "Toshkent viloyati" },
      { id: "toshvil-ohangaron",       name: "Ohangaron",       city: "Toshkent viloyati" },
      { id: "toshvil-olmaliq",         name: "Olmaliq",         city: "Toshkent viloyati" },
      { id: "toshvil-oqqorgon",        name: "Oqqo'rg'on",      city: "Toshkent viloyati" },
      { id: "toshvil-parkent",         name: "Parkent",         city: "Toshkent viloyati" },
      { id: "toshvil-piskent",         name: "Piskent",         city: "Toshkent viloyati" },
      { id: "toshvil-quyi-chirchiq",   name: "Quyi Chirchiq",   city: "Toshkent viloyati" },
      { id: "toshvil-toshkent",        name: "Toshkent tumani", city: "Toshkent viloyati" },
      { id: "toshvil-urtachirchiq",    name: "O'rta Chirchiq",  city: "Toshkent viloyati" },
      { id: "toshvil-yangiyo'l",       name: "Yangiyo'l",       city: "Toshkent viloyati" },
      { id: "toshvil-yuqori-chirchiq", name: "Yuqori Chirchiq", city: "Toshkent viloyati" },
      { id: "toshvil-zangiota",        name: "Zangiota",        city: "Toshkent viloyati" },
      { id: "toshvil-nurafshon",       name: "Nurafshon",       city: "Toshkent viloyati" },
    ];

    res.json({ success: true, data: districts });
  } catch (error) {
    next(error);
  }
};
