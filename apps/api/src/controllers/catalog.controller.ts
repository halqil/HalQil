import { Request, Response, NextFunction } from 'express';

export const getDistricts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const districts = [
      { id: "toshkent-chilonzor", name: "Chilonzor", city: "Toshkent" },
      { id: "toshkent-yunusobod", name: "Yunusobod", city: "Toshkent" },
      { id: "toshkent-mirzo-ulugbek", name: "Mirzo Ulug'bek", city: "Toshkent" },
      { id: "toshkent-shayxontohur", name: "Shayxontohur", city: "Toshkent" },
      { id: "toshkent-olmazor", name: "Olmazor", city: "Toshkent" },
      { id: "toshkent-uchtepa", name: "Uchtepa", city: "Toshkent" },
      { id: "toshkent-yakkasaroy", name: "Yakkasaroy", city: "Toshkent" },
      { id: "toshkent-sergeli", name: "Sergeli", city: "Toshkent" },
      { id: "toshkent-bektemir", name: "Bektemir", city: "Toshkent" },
      { id: "toshkent-mirobod", name: "Mirobod", city: "Toshkent" },
      { id: "samarqand-markaz", name: "Samarqand markazi", city: "Samarqand" },
      { id: "buxoro-markaz", name: "Buxoro markazi", city: "Buxoro" },
      { id: "andijon-markaz", name: "Andijon markazi", city: "Andijon" },
      { id: "namangan-markaz", name: "Namangan markazi", city: "Namangan" },
      { id: "fargona-markaz", name: "Farg'ona markazi", city: "Farg'ona" }
    ];

    res.json({ success: true, data: districts });
  } catch (error) {
    next(error);
  }
};
