import { Router } from "express";
import { getSiteSettings } from "../db";

const router = Router();

router.use(async (_req, res, next) => {
  try {
    const settings = await getSiteSettings();
    res.locals.siteTitle = settings.site_title || "OTR Life";
    res.locals.siteTagline = settings.tagline || "A trucker-first publication for practical life on the road.";
    next();
  } catch (err) {
    next(err);
  }
});

function getSiteUrl(req: { protocol: string; get(name: string): string | undefined }) {
  const host = req.get("host") || "localhost:3000";
  return `${req.protocol}://${host}`;
}

function pageMeta(base: {
  title: string;
  description: string;
  canonical?: string;
}) {
  return {
    pageTitle: base.title,
    metaDescription: base.description,
    canonicalUrl: base.canonical || "",
  };
}

function parsePositiveNumber(input: unknown): number | null {
  const value = Number(String(input || "").trim());
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

function parseNonNegativeInteger(input: unknown, fallback = 0): number | null {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 0) {
    return null;
  }
  return value;
}

function getString(input: unknown): string {
  return String(input || "").trim();
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function normalizeText(input: string): string[] {
  return input
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
}

function parseTimestampAndNote(line: string): { timestamp: string; note: string } {
  const match = line.match(
    /^(\d{1,2}:\d{2}(?:\s?[AaPp][Mm])?|\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}(?:\s?[AaPp][Mm])?)\s*(?:-|\|)\s*(.+)$/,
  );
  if (!match) {
    return { timestamp: "", note: line };
  }
  return { timestamp: match[1].trim(), note: match[2].trim() };
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function formatDateTimeOutput(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

router.get("/", (req, res) => {
  res.render("public/tools/index", {
    ...pageMeta({
      title: "Tools for Truck Drivers | OTR Life",
      description: "Free practical trucking tools: fuel cost calculator, mileage calculator, route log cleaner, and ETA time zone helper.",
      canonical: `${getSiteUrl(req)}/tools`,
    }),
  });
});

router.get("/mileage-calculator", (req, res) => {
  res.render("public/tools/mileage-calculator", {
    ...pageMeta({
      title: "Multi-Stop Mileage Calculator | OTR Life Tools",
      description: "Calculate road miles between multiple stops using real routing data. Enter cities, states, or ZIP codes.",
      canonical: `${getSiteUrl(req)}/tools/mileage-calculator`,
    }),
    mapboxToken: process.env.MAPBOX_TOKEN || "",
  });
});

router.get("/fuel-cost", (req, res) => {
  res.render("public/tools/fuel-cost", {
    ...pageMeta({
      title: "Fuel Cost Estimator | OTR Life Tools",
      description: "Estimate gallons used, total fuel spend, and cost per mile for a trip.",
      canonical: `${getSiteUrl(req)}/tools/fuel-cost`,
    }),
    formData: { miles: "", mpg: "", diesel_price: "" },
    errors: [] as string[],
    result: null as null | {
      gallons_used: string;
      total_cost: string;
      cost_per_mile: string;
    },
  });
});

router.post("/fuel-cost", (req, res) => {
  const formData = {
    miles: getString(req.body.miles),
    mpg: getString(req.body.mpg),
    diesel_price: getString(req.body.diesel_price),
  };
  const errors: string[] = [];

  const miles = parsePositiveNumber(formData.miles);
  const mpg = parsePositiveNumber(formData.mpg);
  const dieselPrice = parsePositiveNumber(formData.diesel_price);

  if (miles === null) {
    errors.push("Miles must be a number greater than 0.");
  }
  if (mpg === null) {
    errors.push("MPG must be a number greater than 0.");
  }
  if (dieselPrice === null) {
    errors.push("Diesel price must be a number greater than 0.");
  }

  let result: null | { gallons_used: string; total_cost: string; cost_per_mile: string } = null;
  if (errors.length === 0 && miles && mpg && dieselPrice) {
    const gallonsUsed = miles / mpg;
    const totalCost = gallonsUsed * dieselPrice;
    const costPerMile = totalCost / miles;
    result = {
      gallons_used: formatMoney(gallonsUsed),
      total_cost: formatMoney(totalCost),
      cost_per_mile: formatMoney(costPerMile),
    };
  }

  res.render("public/tools/fuel-cost", {
    ...pageMeta({
      title: "Fuel Cost Estimator | OTR Life Tools",
      description: "Estimate gallons used, total fuel spend, and cost per mile for a trip.",
      canonical: `${getSiteUrl(req)}/tools/fuel-cost`,
    }),
    formData,
    errors,
    result,
  });
});

router.get("/route-log", (req, res) => {
  res.render("public/tools/route-log", {
    ...pageMeta({
      title: "Route Log Converter | OTR Life Tools",
      description: "Turn messy route notes into a clean trip log and CSV you can copy quickly.",
      canonical: `${getSiteUrl(req)}/tools/route-log`,
    }),
    formData: { raw_text: "", date: "", truck_number: "", trailer_number: "" },
    errors: [] as string[],
    result: null as null | { cleanLog: string; csv: string; entryCount: number },
  });
});

router.post("/route-log", (req, res) => {
  const formData = {
    raw_text: getString(req.body.raw_text),
    date: getString(req.body.date),
    truck_number: getString(req.body.truck_number),
    trailer_number: getString(req.body.trailer_number),
  };
  const errors: string[] = [];

  if (!formData.raw_text) {
    errors.push("Raw notes are required.");
  }

  let result: null | { cleanLog: string; csv: string; entryCount: number } = null;
  if (errors.length === 0) {
    const lines = normalizeText(formData.raw_text);
    if (lines.length === 0) {
      errors.push("Please add at least one non-empty note line.");
    } else {
      const cleanParts: string[] = [];
      if (formData.date) {
        cleanParts.push(`Date: ${formData.date}`);
      }
      if (formData.truck_number) {
        cleanParts.push(`Truck Number: ${formData.truck_number}`);
      }
      if (formData.trailer_number) {
        cleanParts.push(`Trailer Number: ${formData.trailer_number}`);
      }
      if (cleanParts.length > 0) {
        cleanParts.push("");
      }
      cleanParts.push("Entries:");
      for (const line of lines) {
        cleanParts.push(`- ${line}`);
      }

      const csvLines = ["timestamp,note"];
      for (const line of lines) {
        const parsed = parseTimestampAndNote(line);
        csvLines.push(`${csvEscape(parsed.timestamp)},${csvEscape(parsed.note)}`);
      }

      result = {
        cleanLog: cleanParts.join("\n"),
        csv: csvLines.join("\n"),
        entryCount: lines.length,
      };
    }
  }

  res.render("public/tools/route-log", {
    ...pageMeta({
      title: "Route Log Converter | OTR Life Tools",
      description: "Turn messy route notes into a clean trip log and CSV you can copy quickly.",
      canonical: `${getSiteUrl(req)}/tools/route-log`,
    }),
    formData,
    errors,
    result,
  });
});

router.get("/eta-timezone", (req, res) => {
  res.render("public/tools/eta-timezone", {
    ...pageMeta({
      title: "ETA + Time Zone Helper | OTR Life Tools",
      description: "Calculate arrival time from departure, driving hours, stop time, and timezone shift.",
      canonical: `${getSiteUrl(req)}/tools/eta-timezone`,
    }),
    formData: {
      departure_datetime: "",
      driving_hours: "",
      stop_minutes: "0",
      timezone_shift: "0",
    },
    errors: [] as string[],
    result: null as null | { arrival: string; totalDuration: string },
  });
});

router.post("/eta-timezone", (req, res) => {
  const formData = {
    departure_datetime: getString(req.body.departure_datetime),
    driving_hours: getString(req.body.driving_hours),
    stop_minutes: getString(req.body.stop_minutes || "0"),
    timezone_shift: getString(req.body.timezone_shift || "0"),
  };
  const errors: string[] = [];

  const departureDate = formData.departure_datetime ? new Date(formData.departure_datetime) : null;
  const drivingHours = parsePositiveNumber(formData.driving_hours);
  const stopMinutes = parseNonNegativeInteger(formData.stop_minutes, 0);
  const timezoneShift = Number.parseInt(formData.timezone_shift, 10);
  const allowedShifts = new Set([-3, -2, -1, 0, 1, 2, 3]);

  if (!departureDate || Number.isNaN(departureDate.getTime())) {
    errors.push("Departure date/time is required.");
  }
  if (drivingHours === null) {
    errors.push("Driving hours must be a number greater than 0.");
  }
  if (stopMinutes === null) {
    errors.push("Stop minutes must be 0 or greater.");
  }
  if (!allowedShifts.has(timezoneShift)) {
    errors.push("Timezone shift must be between -3 and +3 hours.");
  }

  let result: null | { arrival: string; totalDuration: string } = null;
  if (errors.length === 0 && departureDate && drivingHours !== null && stopMinutes !== null) {
    const totalDurationHours = drivingHours + stopMinutes / 60;
    const totalMs = totalDurationHours * 60 * 60 * 1000;
    const tzMs = timezoneShift * 60 * 60 * 1000;
    const arrival = new Date(departureDate.getTime() + totalMs + tzMs);

    result = {
      arrival: formatDateTimeOutput(arrival),
      totalDuration: totalDurationHours.toFixed(2),
    };
  }

  res.render("public/tools/eta-timezone", {
    ...pageMeta({
      title: "ETA + Time Zone Helper | OTR Life Tools",
      description: "Calculate arrival time from departure, driving hours, stop time, and timezone shift.",
      canonical: `${getSiteUrl(req)}/tools/eta-timezone`,
    }),
    formData,
    errors,
    result,
  });
});

export default router;


