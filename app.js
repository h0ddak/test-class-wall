// ===================================================
// 우리 반 담벼락 - Firebase Firestore 및 Google 로그인 연동
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
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Firebase 설정 정보
const firebaseConfig = {
  apiKey: "AIzaSyDLs_YPcmFaJFsFdw2YSt_VJ5qpmXUII_w",
  authDomain: "test-class-wall-5a61d.firebaseapp.com",
  projectId: "test-class-wall-5a61d",
  storageBucket: "test-class-wall-5a61d.firebasestorage.app",
  messagingSenderId: "190716540909",
  appId: "1:190716540909:web:4d9f7b0672f648fc8499e4"
};

// Firebase, Firestore, Auth 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Firestore 컬렉션 참조
const memosCol = collection(db, "memos");

// 현재 로그인한 사용자 정보 (미로그인 시 null)
let currentUser = null;

// 현재 화면에 표시할 메모 목록 캐시
let memos = [];

// ===================================================
// 사용자 로그인 / 로그아웃 영역 렌더링
// ===================================================

const userArea = document.getElementById("userArea");
const input = document.getElementById("input");

function renderUserArea() {
  userArea.innerHTML = "";

  if (currentUser) {
    // 로그인 상태: 사용자 이름과 로그아웃 버튼 표시
    const greeting = document.createElement("span");
    greeting.textContent = `${currentUser.displayName || "익명"}님 환영합니다! `;
    userArea.appendChild(greeting);

    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "로그아웃";
    logoutBtn.addEventListener("click", async function () {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("로그아웃 오류:", err);
      }
    });
    userArea.appendChild(logoutBtn);

    // 입력창 활성화
    input.disabled = false;
    input.placeholder = "메모를 쓰고 엔터";
  } else {
    // 로그아웃 상태: 로그인 안내 및 구글 로그인 버튼 표시
    const guide = document.createElement("span");
    guide.textContent = "메모를 작성하려면 먼저 로그인해 주세요. ";
    userArea.appendChild(guide);

    const loginBtn = document.createElement("button");
    loginBtn.textContent = "Google로 로그인";
    loginBtn.addEventListener("click", async function () {
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        console.error("구글 로그인 오류:", err);
        alert("로그인에 실패했습니다. 다시 시도해 주세요.");
      }
    });
    userArea.appendChild(loginBtn);

    // 입력창 비활성화
    input.disabled = true;
    input.placeholder = "로그인 후 메모를 작성할 수 있습니다";
  }
}

// 로그인 상태 변경 감지
onAuthStateChanged(auth, function (user) {
  currentUser = user;
  renderUserArea();
});

// ===================================================
// 데이터를 다루는 함수 세 개
// ===================================================

// 메모를 읽어 옵니다. (현재 메모 배열 반환)
function loadMemos() {
  return memos.slice();
}

// 메모를 새로 씁니다. (Firestore에 저장, 5글자 이상일 때만 저장)
async function addMemo(text) {
  const trimmedText = text.trim();
  if (trimmedText.length < 5) {
    alert("메모는 5글자 이상 입력해주세요.");
    return;
  }

  try {
    await addDoc(memosCol, {
      text: trimmedText,
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

input.addEventListener("keydown", async function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    if (!currentUser) {
      alert("로그인 후 작성할 수 있습니다.");
      return;
    }

    const text = input.value.trim();
    if (text.length < 5) {
      alert("메모는 5글자 이상 입력해주세요.");
      return;
    }

    input.value = "";
    await addMemo(text);
  }
});

input.focus();
