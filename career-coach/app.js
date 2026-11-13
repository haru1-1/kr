// 학습용 가상 데이터: 각 분야의 활동 가중치(0~5)와 체험 미션
const careerFields = [
  {
    name: "공학·로봇",
    weights: { making: 5, observing: 2, writing: 1, teamwork: 2 },
    mission: "종이와 테이프로 작은 다리를 만들고, 어떤 구조가 가장 튼튼한지 10분 동안 시험해 보세요."
  },
  {
    name: "과학·연구",
    weights: { making: 2, observing: 5, writing: 2, teamwork: 1 },
    mission: "얼음이 녹는 모습을 10분 동안 관찰하고, 변화한 점을 세 가지 기록해 보세요."
  },
  {
    name: "콘텐츠·미디어",
    weights: { making: 2, observing: 2, writing: 5, teamwork: 3 },
    mission: "학교생활의 작은 팁을 주제로 10분 안에 짧은 카드뉴스 3장의 문구를 기획해 보세요."
  },
  {
    name: "경영·기획",
    weights: { making: 2, observing: 2, writing: 3, teamwork: 5 },
    mission: "친구들과 할 수 있는 미니 행사를 하나 정하고, 역할과 준비물을 10분 동안 나눠 계획해 보세요."
  },
  {
    name: "디자인·제품",
    weights: { making: 5, observing: 2, writing: 3, teamwork: 2 },
    mission: "자주 쓰는 물건 하나를 골라 불편한 점을 찾고, 종이에 개선된 모습을 10분 동안 그려 보세요."
  }
];

const activityLabels = {
  making: "만들기",
  observing: "관찰하기",
  writing: "글쓰기",
  teamwork: "협업하기"
};
const activityKeys = Object.keys(activityLabels);
const form = document.querySelector("#preference-form");
const message = document.querySelector("#form-message");
const resultList = document.querySelector("#result-list");

// 입력값이 모두 숫자이며 0~3의 정수인지 검사한다.
function validatePreferences(rawValues) {
  for (const key of activityKeys) {
    const value = rawValues[key];
    if (value === "" || value === null || value === undefined) {
      return { valid: false, message: `${activityLabels[key]} 점수를 입력해 주세요.` };
    }
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0 || number > 3) {
      return { valid: false, message: `${activityLabels[key]}은(는) 0~3 사이의 정수로 입력해 주세요.` };
    }
  }
  return { valid: true, values: Object.fromEntries(activityKeys.map(key => [key, Number(rawValues[key])])) };
}

// 선호도 × 가중치를 합산하고 높은 점수 순으로 정렬한다.
function rankCareers(fields, preferences) {
  if (!Array.isArray(fields) || fields.length === 0) return [];
  return fields.map(field => {
    const contributions = activityKeys.map(key => ({
      key,
      label: activityLabels[key],
      points: preferences[key] * field.weights[key]
    }));
    const total = contributions.reduce((sum, item) => sum + item.points, 0);
    const strongest = contributions
      .filter(item => item.points > 0)
      .sort((a, b) => b.points - a.points);
    return { ...field, total, contributions, strongest };
  }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "ko"));
}

// HTML 요소를 안전하게 생성해 결과를 표시한다.
function renderResults(ranked) {
  resultList.replaceChildren();
  if (ranked.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<span class='empty-icon' aria-hidden='true'>!</span><h3>추천할 분야가 없어요.</h3><p>분야 데이터 목록이 비어 있습니다. careerFields 배열을 확인해 주세요.</p>";
    resultList.append(empty);
    return;
  }

  const maxScore = Math.max(...ranked.map(item => item.total), 1);
  ranked.slice(0, 3).forEach((item, index) => {
    const card = document.createElement("article");
    card.className = `result-card${index === 0 ? " top" : ""}`;

    const topLine = document.createElement("div");
    topLine.className = "result-topline";
    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = index === 0 ? "가장 먼저 탐색해 볼 분야" : `추천 ${index + 1}순위`;
    const score = document.createElement("span");
    score.className = "score";
    score.textContent = `${item.total}점`;
    topLine.append(rank, score);

    const title = document.createElement("h3");
    title.textContent = item.name;
    const reason = document.createElement("p");
    reason.className = "reason";
    reason.textContent = item.strongest.length
      ? `추천 근거: ${item.strongest.slice(0, 2).map(part => `${part.label} ${part.points}점`).join(", ")} 항목이 점수에 크게 반영됐어요.`
      : "아직 두드러지는 선호 활동이 없어요. 여러 활동을 조금씩 체험해 보세요.";

    const track = document.createElement("div");
    track.className = "bar-track";
    track.setAttribute("role", "img");
    track.setAttribute("aria-label", `최고 점수 대비 ${Math.round(item.total / maxScore * 100)}퍼센트`);
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${item.total / maxScore * 100}%`;
    track.append(fill);

    const mission = document.createElement("div");
    mission.className = "mission";
    const missionTitle = document.createElement("strong");
    missionTitle.textContent = "⏱ 10분 체험 미션";
    const missionText = document.createElement("span");
    missionText.textContent = item.mission;
    mission.append(missionTitle, missionText);
    card.append(topLine, title, reason, track, mission);
    resultList.append(card);
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();
  message.textContent = "";
  const rawValues = Object.fromEntries(activityKeys.map(key => [
    key, form.elements.namedItem(key).value
  ]));
  const checked = validatePreferences(rawValues);
  if (!checked.valid) {
    message.textContent = checked.message;
    const missingKey = activityKeys.find(key => rawValues[key] === "");
    if (missingKey) form.elements.namedItem(missingKey).focus();
    return;
  }
  renderResults(rankCareers(careerFields, checked.values));
});

// 데이터가 비어 있거나 입력값이 빠진 경우도 확인할 수 있는 간단한 자체 점검
console.assert(rankCareers([], { making: 3, observing: 0, writing: 0, teamwork: 0 }).length === 0,
  "빈 분야 목록은 빈 결과를 반환해야 합니다.");
console.assert(!validatePreferences({ making: 3, observing: "", writing: 0, teamwork: 0 }).valid,
  "누락된 입력값은 유효하지 않아야 합니다.");
