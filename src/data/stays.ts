export type StayBadge = "인기" | "신규" | "특가";

export type Stay = {
  id: string;
  name: string;
  location: string;
  category: string;
  tags: string[];
  rating: number;
  reviews: number;
  price: number;
  image: string;
  badge?: StayBadge;
  coords?: { lat: number; lng: number };
  address?: string;
};

export const REGIONS: { name: string; lat: number; lng: number; query: string }[] = [
  { name: "서울", lat: 37.5665, lng: 126.978, query: "서울" },
  { name: "부산", lat: 35.1796, lng: 129.0756, query: "부산" },
  { name: "제주", lat: 33.4996, lng: 126.5312, query: "제주도" },
  { name: "강원", lat: 37.8228, lng: 128.1555, query: "강원" },
  { name: "경주", lat: 35.8562, lng: 129.2247, query: "경주" },
];

// Fake coordinates assigned across stays for map display
const FAKE_COORDS: { lat: number; lng: number }[] = [
  { lat: 33.2541, lng: 126.5609 },
  { lat: 33.3617, lng: 126.5292 },
  { lat: 33.3944, lng: 126.239 },
  { lat: 33.4589, lng: 126.9229 },
  { lat: 33.3131, lng: 126.7968 },
  { lat: 33.2891, lng: 126.4123 },
  { lat: 33.4012, lng: 126.6789 },
  { lat: 33.4823, lng: 126.4789 },
  { lat: 33.3456, lng: 126.8123 },
  { lat: 33.2345, lng: 126.5891 },
];

export const CATEGORIES = ["전체", "리조트", "풀빌라", "글램핑", "게스트하우스", "펜션", "호텔"] as const;

export const SORT_OPTIONS = ["인기순", "낮은가격순", "높은가격순", "평점순"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const STAYS: Stay[] = [
  {
    id: "1",
    name: "오션뷰 프리미엄 풀빌라",
    location: "제주 서귀포시",
    category: "풀빌라",
    tags: ["해수욕장 5분", "조식포함"],
    rating: 4.92,
    reviews: 128,
    price: 320000,
    image: "linear-gradient(135deg, hsl(200 30% 70%), hsl(210 40% 50%))",
    badge: "인기",
  },
  {
    id: "2",
    name: "솔숲 글램핑 리트릿",
    location: "강원 양양군",
    category: "글램핑",
    tags: ["반려동물 동반", "바베큐"],
    rating: 4.81,
    reviews: 92,
    price: 180000,
    image: "linear-gradient(135deg, hsl(90 25% 65%), hsl(110 30% 40%))",
    badge: "신규",
  },
  {
    id: "3",
    name: "한옥 스테이 도담",
    location: "전북 전주시",
    category: "게스트하우스",
    tags: ["전통한옥", "조식포함"],
    rating: 4.95,
    reviews: 211,
    price: 145000,
    image: "linear-gradient(135deg, hsl(30 30% 70%), hsl(20 40% 45%))",
  },
  {
    id: "4",
    name: "마운틴 뷰 리조트",
    location: "강원 평창군",
    category: "리조트",
    tags: ["스파", "스키장 인접"],
    rating: 4.78,
    reviews: 340,
    price: 410000,
    image: "linear-gradient(135deg, hsl(220 20% 60%), hsl(240 25% 35%))",
    badge: "특가",
  },
  {
    id: "5",
    name: "해운대 시그니처 호텔",
    location: "부산 해운대구",
    category: "호텔",
    tags: ["오션뷰", "피트니스"],
    rating: 4.86,
    reviews: 502,
    price: 280000,
    image: "linear-gradient(135deg, hsl(190 35% 65%), hsl(200 50% 40%))",
    badge: "인기",
  },
  {
    id: "6",
    name: "남해 바다 펜션",
    location: "경남 남해군",
    category: "펜션",
    tags: ["해수욕장 도보", "테라스"],
    rating: 4.73,
    reviews: 76,
    price: 165000,
    image: "linear-gradient(135deg, hsl(180 30% 70%), hsl(195 35% 45%))",
  },
  {
    id: "7",
    name: "협재 화이트 풀빌라",
    location: "제주 한림읍",
    category: "풀빌라",
    tags: ["프라이빗풀", "오션뷰"],
    rating: 4.88,
    reviews: 184,
    price: 385000,
    image: "linear-gradient(135deg, hsl(170 25% 75%), hsl(180 35% 50%))",
    badge: "신규",
  },
  {
    id: "8",
    name: "성산 일출 리조트",
    location: "제주 성산읍",
    category: "리조트",
    tags: ["일출뷰", "스파"],
    rating: 4.82,
    reviews: 421,
    price: 295000,
    image: "linear-gradient(135deg, hsl(20 40% 70%), hsl(10 50% 45%))",
  },
  {
    id: "9",
    name: "애월 감성 글램핑",
    location: "제주 애월읍",
    category: "글램핑",
    tags: ["불멍", "조식포함"],
    rating: 4.76,
    reviews: 142,
    price: 195000,
    image: "linear-gradient(135deg, hsl(140 25% 65%), hsl(160 30% 40%))",
    badge: "특가",
  },
  {
    id: "10",
    name: "중문 오션 펜션",
    location: "제주 서귀포시",
    category: "펜션",
    tags: ["바다전망", "주차가능"],
    rating: 4.65,
    reviews: 88,
    price: 175000,
    image: "linear-gradient(135deg, hsl(210 30% 70%), hsl(220 40% 45%))",
  },
].map((s, i) => ({
  ...s,
  coords: FAKE_COORDS[i % FAKE_COORDS.length],
  address: `${s.location} 일주서로 ${100 + i * 23}`,
})) as Stay[];

