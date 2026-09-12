// ===================================================
// 우리 반 담벼락 - Firebase Firestore 연동
// ===================================================

// Firebase SDK 모듈 불러오기 (modular v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Firebase 설정 정보
const firebaseConfig = {
  apiKey: "AIzaSyDLs_YPcmFaJFsFdw2YSt_VJ5qpmXUII_w",
  authDomain: "test-class-wall-5a61d.firebaseapp.com",
  projectId: "test-class-wall-5a61d",
  storageBucket: "test-class-wall-5a61d.firebasestorage.app",
  messagingSenderId: "190716540909",
  appId: "1:190716540909:web:4d9f7b0672f648fc8499e4"
};

// Firebase 및 Firestore 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firestore 컬렉션 참조
const memosCol = collection(db, "memos");

// 현재 화면에 표시할 메모 목록 캐시
let memos = [];

// ===================================================
// 데이터를 다루는 함수 세 개
// ===================================================

// 메모를 읽어 옵니다. (현재 메모 배열 반환)
function loadMemos() {
  return memos.slice();
}

// 메모를 새로 씁니다. (Firestore에 저장)
async function addMemo(text) {
  try {
    await addDoc(memosCol, {
      text: text,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("메모 추가 중 오류가 발생했습니다:", error);
  }
}

// 메모를 지웁니다. (Firestore에서 삭제)
async function deleteMemo(id) {
  try {
    await deleteDoc(doc(db, "memos", id));
  } catch (error) {
    console.error("메모 삭제 중 오류가 발생했습니다:", error);
  }
}

// ===================================================
// 화면 그리기
// ===================================================

function render() {
  const wall = document.getElementById("wall");
  wall.innerHTML = "";

  loadMemos().forEach(function (memo) {
    wall.appendChild(makeMemo(memo));
  });
}

// 메모 한 장 만들기
function makeMemo(memo) {
  const div = document.createElement("div");
  div.className = "memo";

  const del = document.createElement("button");
  del.textContent = "×";
  del.addEventListener("click", function () {
    deleteMemo(memo.id);
  });
  div.appendChild(del);

  const span = document.createElement("span");
  span.textContent = memo.text;
  div.appendChild(span);

  return div;
}

// ===================================================
// 실시간 데이터 감지 (Firestore 실시간 리스너)
// ===================================================

const q = query(memosCol, orderBy("createdAt", "asc"));

onSnapshot(q, function (snapshot) {
  memos = [];
  snapshot.forEach(function (docSnap) {
    const data = docSnap.data();
    memos.push({
      id: docSnap.id,
      text: data.text,
      createdAt: data.createdAt
    });
  });
  render();
});

// ===================================================
// 메모 쓰는 칸
// 엔터를 누르면 담벼락에 붙습니다 (줄바꿈은 Shift + 엔터)
// ===================================================

const input = document.getElementById("input");

input.addEventListener("keydown", async function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    const text = input.value.trim();
    if (text === "") return;

    input.value = "";
    await addMemo(text);
  }
});

input.focus();
