import type { Scenario } from "../types/scenario";

export const toyScenario = {
  id: "toy-chipmaker-rally",
  stockTicker: "FAKE",
  stockName: "Fictional Semiconductor Co.",
  dateRange: {
    start: "2024-01-02",
    end: "2024-01-09",
  },
  priceSeries: [
    { date: "2024-01-02", open: 100, high: 103, low: 99, close: 102, volume: 1200000 },
    { date: "2024-01-03", open: 102, high: 106, low: 101, close: 105, volume: 1500000 },
    { date: "2024-01-04", open: 105, high: 108, low: 104, close: 107, volume: 1420000 },
    { date: "2024-01-05", open: 107, high: 113, low: 106, close: 112, volume: 2100000 },
    { date: "2024-01-08", open: 112, high: 116, low: 111, close: 115, volume: 1960000 },
    { date: "2024-01-09", open: 115, high: 117, low: 113, close: 114, volume: 1300000 },
  ],
  newsItems: [
    {
      date: "2024-01-02",
      headline: "Fictional Semiconductor announces routine board meeting",
      content: "The company scheduled its regular quarterly board meeting for later this month.",
      importance: 1,
      isKeyEvent: false,
    },
    {
      date: "2024-01-03",
      headline: "Major cloud customer expands accelerator order",
      content: "A large cloud operator increased its purchase plan for the company's newest accelerator package.",
      importance: 5,
      isKeyEvent: true,
    },
    {
      date: "2024-01-05",
      headline: "Analysts raise shipment estimates after supply checks",
      content: "Several analysts lifted near-term shipment forecasts after finding tighter advanced packaging capacity.",
      importance: 4,
      isKeyEvent: true,
    },
    {
      date: "2024-01-08",
      headline: "Local utility reports planned maintenance near one office",
      content: "A scheduled power maintenance notice affected an administrative office, not production facilities.",
      importance: 1,
      isKeyEvent: false,
    },
  ],
  timelineSummary: [
    "Cloud accelerator demand surprised to the upside.",
    "Supply checks suggested advanced packaging capacity was tighter than expected.",
    "Routine corporate and local utility notices were noise in this toy scenario.",
  ],
} satisfies Scenario;
