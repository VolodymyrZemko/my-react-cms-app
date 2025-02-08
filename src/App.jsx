import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";

function Tabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("machines");
  const [memberId, setMemberId] = useState(null);
  const [machines, setMachines] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = location.pathname.replace("/", "");
    if (["machines", "orders", "settings"].includes(path)) {
      setActiveTab(path);
    }
  }, [location.pathname]);

  useEffect(() => {
    async function checkUserLogin() {
      try {
        const myCustomer = await window.napi.customer().read();
        const memberID = myCustomer.memberNumber || null;

        if (memberID) {
          console.log("User is logged in:", memberID);
          setMemberId(memberID);
          fetchMachines(); // Якщо юзер залогінений, отримуємо машини
        } else {
          console.log("User is not logged in.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in checkUserLogin:", error);
        setError("Помилка перевірки входу");
        setLoading(false);
      }
    }

    async function fetchMachines() {
      try {
        const userMachines = await window.napi.customer().getMachines();

        if (userMachines.length === 0) {
          setMachines([]);
          setLoading(false);
          return;
        }

        // Отримуємо продукти для кожної машини
        const fetchProducts = await Promise.all(
          userMachines.map(async ({ productId, serialNumber, purchaseDate }) => {
            const productData = await window.napi.catalog().getProduct(productId.split("/").pop());
            return { ...productData, serialNumber, purchaseDate };
          })
        );

        setMachines(fetchProducts);
      } catch (error) {
        console.error("Error fetching machines:", error);
        setError("Помилка отримання машин");
      } finally {
        setLoading(false);
      }
    }

    checkUserLogin();
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    navigate(`/${tab}`);
  };

  return (
    <div>
      <h1>Особистий кабінет</h1>
      <div className="tabs">
        <button onClick={() => handleTabClick("machines")} className={activeTab === "machines" ? "active" : ""}>
          Мої машини
        </button>
        <button onClick={() => handleTabClick("orders")} className={activeTab === "orders" ? "active" : ""}>
          Історія замовлень
        </button>
        <button onClick={() => handleTabClick("settings")} className={activeTab === "settings" ? "active" : ""}>
          Налаштування профілю
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "machines" && (
          <>
            <h2>Мої машини</h2>
            {loading ? (
              <p>Завантаження...</p>
            ) : memberId ? (
              machines.length > 0 ? (
                <ul>
                  {machines.map((machine, index) => (
                    <li key={index}>
                      <h3>{machine.name}</h3>
                      <p><strong>Серійний номер:</strong> {machine.serialNumber}</p>
                      <p><strong>Дата покупки:</strong> {machine.purchaseDate}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>У вас ще немає машин.</p>
              )
            ) : (
              <p>Будь ласка, <a href="/login">увійдіть</a> або <a href="/register">зареєструйтеся</a>.</p>
            )}
          </>
        )}

        {activeTab === "orders" && (
          <>
            <h2>Історія замовлень</h2>
            <p>Функціонал ще в розробці.</p>
          </>
        )}

        {activeTab === "settings" && (
          <>
            <h2>Налаштування профілю</h2>
            <p>Функціонал ще в розробці.</p>
          </>
        )}
      </div>

      <style>{`
        .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
        .tabs button { padding: 10px 15px; border: none; cursor: pointer; background: #ddd; }
        .tabs button.active { background: #555; color: white; }
        .tab-content { border: 1px solid #ddd; padding: 20px; }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Tabs />} />
        <Route path="/machines" element={<Tabs />} />
        <Route path="/orders" element={<Tabs />} />
        <Route path="/settings" element={<Tabs />} />
      </Routes>
    </Router>
  );
}

export default App;
