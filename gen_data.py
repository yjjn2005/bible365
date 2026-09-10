import json

PSALM_PROMPTS = [
    "오늘 시편에서 하나님을 향한 시인의 감정(찬양/탄식/신뢰/회개)은 무엇인가요?",
    "이 시편에서 나에게 가장 와닿는 한 구절은 무엇인가요? 그 이유는?",
    "오늘 시편이 그리는 하나님의 성품 한 가지를 적어보세요.",
    "이 시편의 상황과 비슷한 나의 최근 경험이 있다면 무엇인가요?",
    "오늘 시편을 통해 감사할 제목 하나를 찾아보세요.",
    "이 시편에서 반복되는 단어나 표현이 있다면 무엇이며, 왜 그럴까요?",
    "오늘 시편이 나에게 주는 위로 또는 도전은 무엇인가요?",
    "이 시편을 기도문으로 바꾼다면 첫 문장을 어떻게 쓰시겠어요?",
    "오늘 시편에서 배운 것을 한 문장으로 요약해보세요.",
    "이 시편을 오늘 누군가와 나눈다면 누구와, 왜 나누고 싶나요?",
]

PROVERB_PROMPTS = [
    "오늘 잠언에서 가장 실천하고 싶은 지혜 한 가지는 무엇인가요?",
    "이 장의 잠언 중 나의 말/관계 습관을 돌아보게 하는 구절이 있나요?",
    "오늘 잠언이 경계하라고 말하는 것은 무엇인가요?",
    "이 장에서 발견한 지혜를 오늘 하루 구체적으로 어떻게 적용하시겠어요?",
    "오늘 잠언 중 자녀나 후배에게 전해주고 싶은 구절은 무엇인가요?",
    "이 장이 말하는 지혜로운 사람과 미련한 사람의 차이는 무엇인가요?",
    "오늘 잠언 중 나의 일/재정/관계에 적용할 부분을 찾아보세요.",
    "이 장을 읽고 스스로 점검하고 싶은 습관이 있다면 무엇인가요?",
    "오늘 잠언 중 가장 인상 깊었던 표현을 적어보세요.",
    "이 장의 지혜를 한 문장으로 요약한다면?",
]

# day: 1~365, 앱을 처음 연 날이 1일차
# 1~150일: 시편을 1편부터 150편까지 순서대로 완독
# 151~365일: 시편을 다 마친 뒤, 잠언 1~31장을 반복하며 진행
days = []
for day in range(1, 366):
    if day <= 150:
        book, label, code, suffix = "psalm", "시편", "PSA", "편"
        chapter = day
        prompt = PSALM_PROMPTS[(day - 1) % len(PSALM_PROMPTS)]
    else:
        book, label, code, suffix = "proverb", "잠언", "PRO", "장"
        chapter = ((day - 151) % 31) + 1
        prompt = PROVERB_PROMPTS[(day - 151) % len(PROVERB_PROMPTS)]
    days.append({
        "day": day,
        "book": book,
        "label": label,
        "code": code,
        "chapter": chapter,
        "suffix": suffix,
        "prompt": prompt,
    })

with open("data.js", "w", encoding="utf-8") as f:
    f.write("const READING_PLAN = ")
    json.dump(days, f, ensure_ascii=False)
    f.write(";\n")

print("generated", len(days))
print("day1:", days[0])
print("day150:", days[149])
print("day151:", days[150])
print("day365:", days[364])
