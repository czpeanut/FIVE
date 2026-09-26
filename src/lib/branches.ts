export interface SchoolInfo {
  zh: string;   // 學城文理
  en: string;   // XUECHENG ACADEMY
  char: string; // 學 (stamp character)
}

export const SCHOOL_MAP: Record<string, SchoolInfo> = {
  "逸學文理": { zh: "逸學文理", en: "YIXUE ACADEMY",   char: "逸" },
  "粹學文理": { zh: "粹學文理", en: "CUIXUE ACADEMY",  char: "粹" },
  "達睿文理": { zh: "達睿文理", en: "DARUI ACADEMY",   char: "達" },
  "達學文理": { zh: "達學文理", en: "DAXUE ACADEMY",   char: "達" },
  "學城文理": { zh: "學城文理", en: "XUECHENG ACADEMY",char: "學" },
  "學築文理": { zh: "學築文理", en: "XUEZHU ACADEMY",  char: "築" },
};

export function getSchoolInfo(branch: string): SchoolInfo {
  const key = branch.split(" ")[0];
  return SCHOOL_MAP[key] ?? { zh: key, en: "ACADEMY", char: key[0] ?? "學" };
}

export interface BranchGroup {
  region: string;
  branches: string[];
}

export const BRANCH_GROUPS: BranchGroup[] = [
  {
    region: "宜蘭地區",
    branches: ["逸學文理 羅東校", "逸學文理 蘭女校", "逸學文理 復興校"],
  },
  {
    region: "新竹地區",
    branches: ["逸學文理 六家校"],
  },
  {
    region: "台中地區",
    branches: ["粹學文理 明道校"],
  },
  {
    region: "台南地區",
    branches: [
      "達睿文理 一中校",
      "達睿文理 南女校",
      "達睿文理 二中校",
      "達睿文理 德光校",
      "達睿文理 港明校",
      "達睿文理 善化校",
      "達學文理 復興校",
      "達學文理 德忠校",
    ],
  },
  {
    region: "高雄地區",
    branches: [
      "學城文理 雄中校",
      "學城文理 雄女校",
      "學城文理 鳳中校",
      "學城文理 岡山校",
      "學城文理 中山校",
      "學城文理 三民校",
      "學城文理 左營校",
      "學城文理 道明校",
      "學城文理 五甲校",
      "學城文理 小港校",
      "學築文理 福山校",
      "學築文理 陽明校",
      "學築文理 五福校",
      "學築文理 七賢校",
      "學築文理 明華校",
      "學築文理 龍華校",
      "學築文理 前峰校",
      "學築文理 右昌校",
      "學築文理 左營校",
      "學築文理 五甲校",
    ],
  },
  {
    region: "屏東地區",
    branches: [
      "學城文理 屏中校",
      "學城文理 屏女校",
      "學城文理 潮州校",
      "學築文理 明正校",
      "學築文理 中正校",
    ],
  },
];

export const ALL_BRANCHES = BRANCH_GROUPS.flatMap(g => g.branches);
