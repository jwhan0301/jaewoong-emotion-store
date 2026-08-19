"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type MoodStyle = CSSProperties & {
  "--mood-color"?: string;
  "--mood-card-bg"?: string;
  "--mood-soft"?: string;
  "--mood-ring"?: string;
  "--mood-shadow"?: string;
  "--mood-shadow-strong"?: string;
  "--range-fill"?: string;
  "--day-color"?: string;
  "--day-soft"?: string;
};

type Mood = {
  id: string;
  name: string;
  description: string;
  colorHex: string;
  softHex: string;
  textHex: string;
  isCustom?: boolean;
};

type LogEntry = {
  id: string;
  date: string;
  createdAt: string;
  moodId: string;
  customMood?: string;
  intensity: number;
  note: string;
  tags: string[];
};

const STORAGE_KEY = "personal-mood-log-v2";

const moods: Mood[] = [
  {
    id: "peace",
    name: "평온",
    description: "차분 · 여유 · 안도",
    colorHex: "#9CA986",
    softHex: "#F0F3EA",
    textHex: "#59654B",
  },
  {
    id: "energy",
    name: "활력",
    description: "기쁨 · 설렘 · 성취",
    colorHex: "#E8C872",
    softHex: "#FFF7DF",
    textHex: "#826529",
  },
  {
    id: "sink",
    name: "침잠",
    description: "우울 · 무기력 · 공허",
    colorHex: "#7A90A4",
    softHex: "#EEF3F7",
    textHex: "#495C70",
  },
  {
    id: "tension",
    name: "긴장",
    description: "예민 · 불안 · 답답",
    colorHex: "#C88EA7",
    softHex: "#FBEEF4",
    textHex: "#8B5570",
  },
  {
    id: "thought",
    name: "사색",
    description: "복잡 · 고찰 · 회고",
    colorHex: "#A3A3A3",
    softHex: "#F0F0EE",
    textHex: "#626262",
  },
  {
    id: "other",
    name: "기타",
    description: "직접 입력",
    colorHex: "#A3A3A3",
    softHex: "#F7F7F5",
    textHex: "#595959",
    isCustom: true,
  },
];

const defaultTags = ["밤", "정리", "휴식", "관계", "성장", "회복"];
const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function displayDate(key: string) {
  const [, month, day] = key.split("-").map(Number);
  const date = new Date(`${key}T12:00:00`);

  return `${month}월 ${day}일 ${dayLabels[date.getDay()]}요일`;
}

function compactDate(key: string) {
  const [, month, day] = key.split("-").map(Number);

  return `${month}.${day}`;
}

function buildWeekDays(anchorKey: string, weekOffset: number) {
  const base = new Date(`${anchorKey}T12:00:00`);
  base.setDate(base.getDate() + weekOffset * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() - (6 - index));
    const key = dateKey(date);

    return {
      key,
      day: dayLabels[date.getDay()],
      label: compactDate(key),
    };
  });
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dateKey(date);

    return {
      key,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

function displayMonth(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function weekOffsetForDate(todayKey: string, targetKey: string) {
  const todayDate = new Date(`${todayKey}T12:00:00`);
  const targetDate = new Date(`${targetKey}T12:00:00`);
  const dayDiff = Math.floor(
    (targetDate.getTime() - todayDate.getTime()) / 86_400_000,
  );

  return Math.min(0, Math.floor(dayDiff / 7));
}

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getMood(id: string) {
  return moods.find((mood) => mood.id === id) ?? moods[0];
}

function displayMood(entry: LogEntry) {
  const mood = getMood(entry.moodId);

  if (mood.isCustom) {
    return entry.customMood?.trim() || "이름 붙이기 전의 감정";
  }

  return mood.name;
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function seedEntries(today: string): LogEntry[] {
  const base = new Date(`${today}T12:00:00`);
  const previousDay = new Date(base);
  previousDay.setDate(base.getDate() - 1);

  return [
    {
      id: "seed-today",
      date: today,
      createdAt: `${today}T10:30:00.000Z`,
      moodId: "peace",
      intensity: 3,
      note: "오늘은 안쪽이 조금 조용해진 느낌. 급하게 답을 내리지 않아도 괜찮았다.",
      tags: ["밤", "정리"],
    },
    {
      id: "seed-yesterday",
      date: dateKey(previousDay),
      createdAt: `${dateKey(previousDay)}T14:10:00.000Z`,
      moodId: "sink",
      intensity: 2,
      note: "기운은 적었지만, 해야 할 일을 작게 쪼개니 숨 쉴 틈이 생겼다.",
      tags: ["휴식", "회복"],
    },
  ];
}

export default function Home() {
  const today = useMemo(() => dateKey(new Date()), []);
  const [selectedMood, setSelectedMood] = useState(moods[0].id);
  const [customMood, setCustomMood] = useState("");
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["밤"]);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const [visiblePastCount, setVisiblePastCount] = useState(4);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(`${today}T12:00:00`),
  );
  const [moodFilter, setMoodFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        setEntries(JSON.parse(stored) as LogEntry[]);
      } catch {
        setEntries(seedEntries(today));
      }
    } else {
      setEntries(seedEntries(today));
    }

    setIsReady(true);
  }, [today]);

  useEffect(() => {
    if (isReady) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, isReady]);

  useEffect(() => {
    setVisiblePastCount(4);
  }, [moodFilter, selectedDate, tagFilter]);

  const weekDays = useMemo(
    () => buildWeekDays(today, weekOffset),
    [today, weekOffset],
  );
  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth),
    [calendarMonth],
  );

  const allTags = useMemo(() => {
    return Array.from(
      new Set([...defaultTags, ...entries.flatMap((entry) => entry.tags)]),
    );
  }, [entries]);

  const entriesForSelectedDate = useMemo(() => {
    return entries
      .filter((entry) => entry.date === selectedDate)
      .filter((entry) => moodFilter === "all" || entry.moodId === moodFilter)
      .filter((entry) => tagFilter === "all" || entry.tags.includes(tagFilter))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, moodFilter, selectedDate, tagFilter]);

  const pastEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.date < selectedDate)
      .filter((entry) => moodFilter === "all" || entry.moodId === moodFilter)
      .filter((entry) => tagFilter === "all" || entry.tags.includes(tagFilter))
      .sort((a, b) =>
        b.date === a.date
          ? b.createdAt.localeCompare(a.createdAt)
          : b.date.localeCompare(a.date),
      );
  }, [entries, moodFilter, selectedDate, tagFilter]);

  const visiblePastEntries = pastEntries.slice(0, visiblePastCount);
  const hasMorePastEntries = pastEntries.length > visiblePastCount;

  const weeklyEntries = useMemo(() => {
    const weekKeys = new Set(weekDays.map((day) => day.key));

    return entries.filter((entry) => weekKeys.has(entry.date));
  }, [entries, weekDays]);

  const strongestMood = useMemo(() => {
    if (weeklyEntries.length === 0) {
      return moods[0];
    }

    const counts = weeklyEntries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.moodId] = (acc[entry.moodId] ?? 0) + 1;
      return acc;
    }, {});
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return getMood(top);
  }, [weeklyEntries]);

  const weeklyAverage =
    weeklyEntries.length === 0
      ? 0
      : Math.round(
          (weeklyEntries.reduce((sum, entry) => sum + entry.intensity, 0) /
            weeklyEntries.length) *
            10,
        ) / 10;

  const selectedMoodInfo = getMood(selectedMood);
  const rangeFill = `${((intensity - 1) / 4) * 100}%`;
  const moodStyle: MoodStyle = {
    "--mood-color": selectedMoodInfo.colorHex,
    "--mood-card-bg": hexToRgba(selectedMoodInfo.colorHex, 0.5),
    "--mood-soft": selectedMoodInfo.softHex,
    "--mood-ring": hexToRgba(selectedMoodInfo.colorHex, 0.2),
    "--mood-shadow": hexToRgba(selectedMoodInfo.colorHex, 0.1),
    "--mood-shadow-strong": hexToRgba(selectedMoodInfo.colorHex, 0.16),
    "--range-fill": rangeFill,
  };

  function selectMood(id: string) {
    setSelectedMood(id);
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  function addTypedTag() {
    const clean = tagInput.replace(/^#/, "").trim();

    if (!clean) {
      return;
    }

    setSelectedTags((current) =>
      current.includes(clean) ? current : [...current, clean],
    );
    setTagInput("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!note.trim() && selectedTags.length === 0) {
      return;
    }

    const existingEntry = editingEntryId
      ? entries.find((entry) => entry.id === editingEntryId)
      : null;
    const entry: LogEntry = {
      id: editingEntryId ?? makeId(),
      date: selectedDate,
      createdAt: existingEntry?.createdAt ?? new Date().toISOString(),
      moodId: selectedMood,
      customMood:
        selectedMoodInfo.isCustom && customMood.trim()
          ? customMood.trim()
          : undefined,
      intensity,
      note: note.trim() || "말로 정리되기 전의 감정",
      tags: selectedTags,
    };

    setEntries((current) =>
      editingEntryId
        ? current.map((item) => (item.id === editingEntryId ? entry : item))
        : [entry, ...current],
    );
    setEditingEntryId(null);
    setNote("");
    setTagInput("");
    setCustomMood("");
  }

  function deleteEntry(id: string) {
    if (editingEntryId === id) {
      setEditingEntryId(null);
      setNote("");
      setTagInput("");
      setCustomMood("");
    }

    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  function startEditingEntry(entry: LogEntry) {
    setEditingEntryId(entry.id);
    setSelectedMood(entry.moodId);
    setCustomMood(entry.customMood ?? "");
    setIntensity(entry.intensity);
    setNote(entry.note);
    setSelectedTags([...entry.tags]);
    setSelectedDate(entry.date);
    setWeekOffset(weekOffsetForDate(today, entry.date));
    setCalendarMonth(new Date(`${entry.date}T12:00:00`));
    setTagInput("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingEntryId(null);
    setNote("");
    setTagInput("");
    setCustomMood("");
  }

  function moveWeek(delta: number) {
    const nextOffset = Math.min(0, weekOffset + delta);
    const nextWeekDays = buildWeekDays(today, nextOffset);

    setWeekOffset(nextOffset);
    setSelectedDate(nextWeekDays[nextWeekDays.length - 1].key);
  }

  function selectDateFromCalendar(key: string) {
    setSelectedDate(key);
    setWeekOffset(weekOffsetForDate(today, key));
    setVisiblePastCount(4);
    setIsCalendarOpen(false);
  }

  function shiftCalendarMonth(delta: number) {
    setCalendarMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  }

  function resetDateSelection() {
    setSelectedDate(today);
    setWeekOffset(0);
    setVisiblePastCount(4);
    setCalendarMonth(new Date(`${today}T12:00:00`));
    setIsCalendarOpen(false);
  }

  function renderEntry(entry: LogEntry) {
    const mood = getMood(entry.moodId);

    return (
      <article className="memory-card" key={entry.id}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: mood.colorHex }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: mood.textHex }}
            >
              {displayMood(entry)} · {entry.intensity}/5
            </span>
          </div>
          <div className="entry-action-row">
            <button
              className="edit-button"
              onClick={() => startEditingEntry(entry)}
              type="button"
            >
              수정
            </button>
            <button
              className="delete-button"
              onClick={() => deleteEntry(entry.id)}
              type="button"
            >
              삭제
            </button>
          </div>
        </div>
        <p className="entry-note mt-3 text-sm leading-7 text-[#5F5A52]">
          {entry.note}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <span className="tag-pill" key={tag}>
              #{tag}
            </span>
          ))}
        </div>
      </article>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#333333]" style={moodStyle}>
      <div className="mx-auto grid min-h-screen max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <section className="flex flex-col gap-6">
          <header className="soft-card hero-card px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#77736B]">
                  나만의 감정 저장소
                </p>
                <h1 className="emotion-title mt-3 whitespace-nowrap text-4xl font-semibold leading-tight sm:text-5xl">
                  Emotion Store
                </h1>
              </div>
              <div className="date-picker-wrap">
                <button
                  className="date-pill-button"
                  onClick={() => {
                    setCalendarMonth(new Date(`${selectedDate}T12:00:00`));
                    setIsCalendarOpen((open) => !open);
                  }}
                  type="button"
                >
                  {displayDate(selectedDate)}
                </button>
                {isCalendarOpen ? (
                  <div className="calendar-popover">
                    <div className="calendar-head">
                      <button
                        aria-label="이전 달"
                        className="calendar-nav"
                        onClick={() => shiftCalendarMonth(-1)}
                        type="button"
                      >
                        {"<"}
                      </button>
                      <strong>{displayMonth(calendarMonth)}</strong>
                      <button
                        aria-label="다음 달"
                        className="calendar-nav"
                        onClick={() => shiftCalendarMonth(1)}
                        type="button"
                      >
                        {">"}
                      </button>
                    </div>
                    <div className="calendar-weekdays">
                      {dayLabels.map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>
                    <div className="calendar-grid">
                      {calendarDays.map((day) => (
                        <button
                          className={`calendar-day ${
                            day.key === selectedDate ? "is-selected" : ""
                          } ${day.key === today ? "is-today" : ""} ${
                            day.isCurrentMonth ? "" : "is-muted"
                          }`}
                          disabled={day.key > today}
                          key={day.key}
                          onClick={() => selectDateFromCalendar(day.key)}
                          type="button"
                        >
                          {day.day}
                        </button>
                      ))}
                    </div>
                    <div className="calendar-footer">
                      <button onClick={resetDateSelection} type="button">
                        삭제
                      </button>
                      <button onClick={resetDateSelection} type="button">
                        오늘
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <form className="soft-card emotion-card p-5 sm:p-6" onSubmit={handleSubmit}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">지금의 색</h2>
                <p className="mt-1 text-sm font-medium text-[#7B766E]">
                  {selectedMoodInfo.isCustom
                    ? customMood || "직접 이름 붙이는 감정"
                    : selectedMoodInfo.description}
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1.5 text-sm font-semibold"
                style={{
                  backgroundColor: selectedMoodInfo.softHex,
                  color: selectedMoodInfo.textHex,
                }}
              >
                {selectedMoodInfo.name}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {moods.map((mood) => {
                const active = selectedMood === mood.id;
                const style: MoodStyle = {
                  "--mood-color": mood.colorHex,
                  "--mood-soft": mood.softHex,
                };

                return (
                  <button
                    aria-pressed={active}
                    className={`emotion-pill ${active ? "is-active" : ""} ${
                      mood.isCustom ? "is-custom" : ""
                    }`}
                    key={mood.id}
                    onClick={() => selectMood(mood.id)}
                    style={style}
                    type="button"
                  >
                    <span className="text-base font-semibold">{mood.name}</span>
                    <span className="mt-1 text-xs font-medium">
                      {mood.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className={`custom-emotion-wrap ${
                selectedMoodInfo.isCustom ? "is-open" : ""
              }`}
            >
              <label className="sr-only" htmlFor="customMood">
                기타 감정
              </label>
              <input
                className="soft-input custom-emotion-input"
                id="customMood"
                onChange={(event) => setCustomMood(event.target.value)}
                placeholder="오늘의 감정을 자유롭게 적어주세요"
                type="text"
                value={customMood}
              />
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold" htmlFor="intensity">
                  감정의 선명도
                </label>
                <span className="text-sm font-semibold text-[#6F6A61]">
                  {intensity}/5
                </span>
              </div>
              <input
                className="mood-range mt-3"
                id="intensity"
                max="5"
                min="1"
                onChange={(event) => setIntensity(Number(event.target.value))}
                style={moodStyle}
                type="range"
                value={intensity}
              />
            </div>

            <label className="mt-7 block text-sm font-semibold" htmlFor="note">
              생각 조각
            </label>
            <textarea
              className="soft-textarea mt-2"
              id="note"
              onChange={(event) => setNote(event.target.value)}
              placeholder="잠들기 전 마음에 남은 문장이나 장면을 적어두기"
              spellCheck={false}
              value={note}
            />

            <div className="mt-5 flex flex-wrap gap-2">
              {defaultTags.map((tag) => (
                <button
                  className={`soft-chip ${
                    selectedTags.includes(tag) ? "is-active" : ""
                  }`}
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  type="button"
                >
                  #{tag}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                className="soft-input min-w-0 flex-1"
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTypedTag();
                  }
                }}
                placeholder="나만의 키워드"
                value={tagInput}
              />
              <button className="quiet-button add-keyword-button" onClick={addTypedTag} type="button">
                추가
              </button>
            </div>

            <button className="save-button mt-6" type="submit">
              {editingEntryId ? "기록 수정 완료하기" : "오늘의 감정 저장하기"}
            </button>
            {editingEntryId ? (
              <button
                className="quiet-button edit-cancel-button mt-3 w-full"
                onClick={cancelEditing}
                type="button"
              >
                수정 취소
              </button>
            ) : null}
          </form>
        </section>

        <section className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="soft-card stat-card p-4">
              <p className="text-sm font-semibold text-[#817B72]">이번 주</p>
              <p className="mt-2 text-3xl font-semibold">{weeklyEntries.length}</p>
            </div>
            <div className="soft-card stat-card p-4">
              <p className="text-sm font-semibold text-[#817B72]">
                자주 머문 감정
              </p>
              <p
                className="dashboard-accent-text mt-2 text-3xl font-semibold"
              >
                {strongestMood.name}
              </p>
            </div>
            <div className="soft-card stat-card p-4">
              <p className="text-sm font-semibold text-[#817B72]">평균 선명도</p>
              <p className="dashboard-accent-text mt-2 text-3xl font-semibold">
                {weeklyAverage || "-"}
              </p>
            </div>
          </div>

          <div className="soft-card dashboard-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">주간 감정선</h2>
              <div className="flex items-center gap-2">
                <button
                  aria-label="이전 주"
                  className="quiet-button icon-button"
                  onClick={() => moveWeek(-1)}
                  type="button"
                >
                  {"<"}
                </button>
                <button
                  aria-label="다음 주"
                  className="quiet-button icon-button"
                  disabled={weekOffset === 0}
                  onClick={() => moveWeek(1)}
                  type="button"
                >
                  {">"}
                </button>
                <button
                  className="quiet-button"
                  onClick={() => {
                    setWeekOffset(0);
                    setSelectedDate(today);
                  }}
                  type="button"
                >
                  오늘
                </button>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayEntries = entries.filter((entry) => entry.date === day.key);
                const mood = dayEntries[0] ? getMood(dayEntries[0].moodId) : null;
                const dayIntensity =
                  dayEntries.length === 0
                    ? 0
                    : Math.round(
                        (dayEntries.reduce(
                          (sum, entry) => sum + entry.intensity,
                          0,
                        ) /
                          dayEntries.length) *
                          10,
                      ) / 10;
                const style: MoodStyle = {
                  "--day-color": mood?.colorHex ?? "#D7D3CA",
                  "--day-soft": mood?.softHex ?? "#F5F3EF",
                  "--bar-height":
                    dayIntensity === 0
                      ? "8%"
                      : `${Math.max(18, (dayIntensity / 5) * 100)}%`,
                };

                return (
                  <button
                    className={`week-day ${
                      selectedDate === day.key ? "is-active" : ""
                    }`}
                    key={day.key}
                    onClick={() => setSelectedDate(day.key)}
                    style={style}
                    type="button"
                  >
                    <span className="week-day-text text-xs font-semibold text-[#888278]">
                      {day.day}
                    </span>
                    <span className="week-bar-track">
                      <span className="week-bar-fill" />
                    </span>
                    <span className="week-day-text text-xs font-semibold">
                      {dayIntensity ? `${dayIntensity}/5` : "0/5"}
                    </span>
                    <span className="week-day-text text-xs font-semibold text-[#888278]">
                      {day.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="soft-card archive-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">저장된 마음</h2>
              <span className="text-sm font-semibold text-[#817B72]">
                {displayDate(selectedDate)}
              </span>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {["all", ...moods.map((mood) => mood.id)].map((id) => {
                const mood = id === "all" ? null : getMood(id);

                return (
                  <button
                    className={`filter-pill ${
                      moodFilter === id ? "is-active" : ""
                    }`}
                    key={id}
                    onClick={() => setMoodFilter(id)}
                    type="button"
                  >
                    {mood?.name ?? "전체"}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {["all", ...allTags].map((tag) => (
                <button
                  className={`filter-pill ${
                    tagFilter === tag ? "is-active" : ""
                  }`}
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  type="button"
                >
                  {tag === "all" ? "모든 키워드" : `#${tag}`}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {entriesForSelectedDate.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#DED8CE] bg-[#FBFAF7] p-5 text-sm font-medium text-[#817B72]">
                  아직 담긴 감정이 없는 날
                </div>
              ) : (
                entriesForSelectedDate.map(renderEntry)
              )}
              {visiblePastEntries.length > 0 ? (
                <div className="pt-2">
                  <p className="px-1 text-sm font-semibold text-[#817B72]">
                    과거 기록
                  </p>
                  <div className="mt-3 space-y-3">
                    {visiblePastEntries.map(renderEntry)}
                  </div>
                </div>
              ) : null}
              {hasMorePastEntries ? (
                <button
                  className="history-more-button"
                  onClick={() => setVisiblePastCount((count) => count + 4)}
                  type="button"
                >
                  과거 기록 더 보기
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
