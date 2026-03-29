import { useState, useEffect } from "react";

export default function AdminPage({ onBack }) {
  const [activeTab, setActiveTab] = useState("templates"); // Сделал вкладку шаблонов активной для удобства тестирования
  
  // --- Состояния для Генерации ---
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [eventName, setEventName] = useState("");
  const [generatedFileUrl, setGeneratedFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // --- Состояния для Редактора Шаблонов ---
  const [editorName, setEditorName] = useState("Новый шаблон");
  const [editorBgUrl, setEditorBgUrl] = useState(null);
  const [editorBgFile, setEditorBgFile] = useState(null);
  const [editorElements, setEditorElements] = useState([
    { id: 1, text: "Сертификат", x: 50, y: 20, size: 48, color: "#0F172A", weight: "800" },
    { id: 2, text: "награждается", x: 50, y: 35, size: 24, color: "#64748B", weight: "400" },
    { id: 3, text: "{ФИО}", x: 50, y: 50, size: 40, color: "#1D4ED8", weight: "700" },
    { id: 4, text: "за участие в мероприятии:\n{Мероприятие}", x: 50, y: 70, size: 20, color: "#475569", weight: "400" }
  ]);

  // Загрузка списка шаблонов (для генерации)
  const loadTemplates = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/certificates/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Ошибка загрузки шаблонов:", err);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // --- Функции для Генерации ---
  const handleGenerate = async () => {
    // ... (код генерации остался без изменений) ...
    if (!selectedTemplateId) { setMessage("Выберите шаблон"); return; }
    if (!eventName.trim()) { setMessage("Введите название мероприятия"); return; }
    setLoading(true); setMessage(""); setGeneratedFileUrl(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: selectedTemplateId, event_name: eventName })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedFileUrl(data.file_url);
        setMessage("✅ Сертификат успешно сгенерирован!");
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessage(`❌ ${errData.detail || "Ошибка генерации"}`);
      }
    } catch (err) {
      setMessage("❌ Ошибка соединения с сервером");
    } finally { setLoading(false); }
  };

  const fullUrl = generatedFileUrl ? `http://127.0.0.1:8000${generatedFileUrl}` : null;

  const handleDownload = async () => {
    if (!fullUrl) return;
    try {
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Сертификат_${eventName.replace(/[^a-zA-Z0-9А-Яа-яёЁ ]/g, "_")}.pdf`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setMessage("❌ Ошибка при скачивании файла");
    }
  };

  // --- Функции для Редактора Шаблонов ---
  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditorBgFile(file);
      setEditorBgUrl(URL.createObjectURL(file));
    }
  };

  const addTextElement = () => {
    const newId = editorElements.length > 0 ? Math.max(...editorElements.map(e => e.id)) + 1 : 1;
    setEditorElements([...editorElements, { id: newId, text: "Новый текст", x: 50, y: 50, size: 24, color: "#000000", weight: "400" }]);
  };

  const updateElement = (id, field, value) => {
    setEditorElements(editorElements.map(el => el.id === id ? { ...el, [field]: value } : el));
  };

  const removeElement = (id) => {
    setEditorElements(editorElements.filter(el => el.id !== id));
  };

	const handleSaveTemplate = async () => {
	  if (!editorBgFile && !editorBgUrl) {
		alert("Пожалуйста, выберите фон для шаблона");
		return;
	  }

	  setLoading(true);
	  try {
		let finalBgUrl = editorBgUrl;

		// Шаг 1: Если выбрано новое локальное фото, загружаем его на сервер
		if (editorBgFile) {
		  const formData = new FormData();
		  formData.append("file", editorBgFile);

		  const uploadRes = await fetch("http://127.0.0.1:8000/certificates/upload-background", {
			method: "POST",
			body: formData,
		  });
		  
		  if (!uploadRes.ok) throw new Error("Ошибка при загрузке фона");
		  const uploadData = await uploadRes.json();
		  finalBgUrl = uploadData.background_url;
		}

		// Шаг 2: Создаем основной шаблон
		const templateRes = await fetch("http://127.0.0.1:8000/certificates/templates", {
		  method: "POST",
		  headers: { "Content-Type": "application/json" },
		  body: JSON.stringify({
			name: editorName,
			background_url: finalBgUrl,
			signers_y_mm: 45 // можно добавить поле в редактор позже
		  }),
		});

		if (!templateRes.ok) throw new Error("Ошибка при сохранении шаблона");
		const newTemplate = await templateRes.json();

		// Шаг 3: Сохраняем все текстовые элементы
		// Константы для перевода % в мм (стандарт А4: 210x297 мм)
		// Если у вас фон всегда А4, эти расчеты обеспечат точность в PDF
		const PAGE_WIDTH_MM = 210;
		const PAGE_HEIGHT_MM = 297;

		const elementPromises = editorElements.map((el) => {
		  return fetch(`http://127.0.0.1:8000/certificates/templates/${newTemplate.id}/elements`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
			  text: el.text,
			  is_variable: el.text.includes("{"), // Автоматически определяем переменную
			  x_mm: (el.x / 100) * PAGE_WIDTH_MM,
			  y_mm: (el.y / 100) * PAGE_HEIGHT_MM,
			  font_size: el.size,
			  align: "center"
			}),
		  });
		});

		await Promise.all(elementPromises);

		alert("✅ Шаблон успешно сохранен!");
		loadTemplates(); // Обновляем список в первой вкладке
		setActiveTab("generate"); // Переключаем пользователя на генерацию
		
	  } catch (err) {
		console.error(err);
		alert(`❌ Ошибка: ${err.message}`);
	  } finally {
		setLoading(false);
	  }
};

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* Заголовок */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", margin: 0 }}>Админ-панель</h1>
            <p style={{ color: "#64748B", marginTop: 8 }}>Генерация наградной продукции</p>
          </div>
          {onBack && (
            <button 
              onClick={onBack}
              style={{ padding: "12px 24px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, fontWeight: 600, cursor: "pointer" }}
            >
              ← На главную
            </button>
          )}
        </div>

        {/* Табы */}
        <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 12, padding: 6, marginBottom: 32, width: "fit-content" }}>
          <button 
            onClick={() => setActiveTab("generate")}
            style={{
              padding: "12px 32px", borderRadius: 10, fontWeight: 600, cursor: "pointer", border: "none",
              background: activeTab === "generate" ? "#1D4ED8" : "transparent",
              color: activeTab === "generate" ? "#fff" : "#475569"
            }}
          >
            Генерация
          </button>
          <button 
            onClick={() => setActiveTab("templates")}
            style={{
              padding: "12px 32px", borderRadius: 10, fontWeight: 600, cursor: "pointer", border: "none",
              background: activeTab === "templates" ? "#1D4ED8" : "transparent",
              color: activeTab === "templates" ? "#fff" : "#475569"
            }}
          >
            Управление шаблонами
          </button>
        </div>

        {/* --- ВКЛАДКА: ГЕНЕРАЦИЯ --- */}
        {activeTab === "generate" && (
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            {/* ... Существующий код формы генерации ... (чтобы не дублировать код, он такой же, как в вашем примере) */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 40, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Создать сертификат</h2>
              {/* Поля шаблона и названия */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569" }}>Шаблон</label>
                <select value={selectedTemplateId || ""} onChange={(e) => setSelectedTemplateId(Number(e.target.value))} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 16 }}>
                  <option value="">— Выберите шаблон —</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 32 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569" }}>Название мероприятия (или переменные)</label>
                <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Например: Всероссийская конференция" style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 16 }} />
              </div>
              <button onClick={handleGenerate} disabled={loading || !selectedTemplateId || !eventName.trim()} style={{ width: "100%", padding: "16px", fontSize: "17px", fontWeight: 700, background: loading ? "#94A3B8" : "#1D4ED8", color: "#fff", border: "none", borderRadius: 12, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Генерация..." : "Сгенерировать сертификат"}
              </button>
              {message && (
                <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: message.includes("✅") ? "#ECFDF5" : "#FEF2F2", color: message.includes("✅") ? "#059669" : "#EF4444", fontWeight: 500 }}>{message}</div>
              )}
            </div>

            <div style={{ background: "#fff", borderRadius: 20, padding: 40, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
              <h3 style={{ marginBottom: 20 }}>Результат генерации</h3>
              {generatedFileUrl ? (
                <div>
                  <div style={{ marginBottom: 24, border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", background: "#F8FAFC" }}>
                    <iframe src={fullUrl} style={{ width: "100%", height: "520px", border: "none" }} title="Предпросмотр сертификата" />
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={handleDownload} style={{ flex: 1, padding: "16px", background: "#334155", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 16 }}>⬇️ Скачать PDF</button>
                  </div>
                </div>
              ) : (
                <div style={{ height: 520, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 16, textAlign: "center", border: "2px dashed #CBD5E1", borderRadius: 16 }}>
                  После генерации здесь появится предпросмотр
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- ВКЛАДКА: РЕДАКТОР ШАБЛОНОВ --- */}
        {activeTab === "templates" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            
            {/* Левая колонка: Настройки */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Конструктор</h2>
                <button 
                  onClick={handleSaveTemplate}
                  style={{ padding: "10px 20px", background: "#10B981", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}
                >
                  💾 Сохранить шаблон
                </button>
              </div>

              {/* Основные настройки */}
              <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 12, marginBottom: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Название шаблона</label>
                  <input type="text" value={editorName} onChange={(e) => setEditorName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #CBD5E1" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Фон сертификата (Картинка)</label>
                  <input type="file" accept="image/png, image/jpeg" onChange={handleBgUpload} style={{ width: "100%", padding: "8px", background: "#fff", borderRadius: 8, border: "1px solid #CBD5E1" }} />
                </div>
              </div>

              {/* Управление текстами */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Текстовые блоки</h3>
                <button onClick={addTextElement} style={{ padding: "6px 12px", background: "#E0E7FF", color: "#4338CA", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                  + Добавить текст
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "500px", overflowY: "auto", paddingRight: 8 }}>
                {editorElements.map((el, index) => (
                  <div key={el.id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, position: "relative" }}>
                    <button 
                      onClick={() => removeElement(el.id)}
                      style={{ position: "absolute", top: 12, right: 12, background: "#FEE2E2", color: "#EF4444", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontWeight: "bold" }}
                      title="Удалить"
                    >
                      ×
                    </button>
                    
                    <div style={{ marginBottom: 12, paddingRight: 32 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Текст (используйте {"{Переменные}"})</label>
                      <textarea 
                        value={el.text} 
                        onChange={(e) => updateElement(el.id, "text", e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #CBD5E1", marginTop: 4, resize: "vertical", minHeight: "60px" }} 
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Ось X: {el.x}%</label>
                        <input type="range" min="0" max="100" value={el.x} onChange={(e) => updateElement(el.id, "x", Number(e.target.value))} style={{ width: "100%" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Ось Y: {el.y}%</label>
                        <input type="range" min="0" max="100" value={el.y} onChange={(e) => updateElement(el.id, "y", Number(e.target.value))} style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <div>
                         <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Размер</label>
                         <input type="number" value={el.size} onChange={(e) => updateElement(el.id, "size", Number(e.target.value))} style={{ width: "100%", padding: "6px", borderRadius: 6, border: "1px solid #CBD5E1" }} />
                      </div>
                      <div>
                         <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Толщина</label>
                         <select value={el.weight} onChange={(e) => updateElement(el.id, "weight", e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: 6, border: "1px solid #CBD5E1" }}>
                            <option value="400">Normal</option>
                            <option value="600">Semi-bold</option>
                            <option value="700">Bold</option>
                            <option value="800">Extra-bold</option>
                         </select>
                      </div>
                      <div>
                         <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Цвет</label>
                         <input type="color" value={el.color} onChange={(e) => updateElement(el.id, "color", e.target.value)} style={{ width: "100%", height: 32, padding: 0, border: "none", cursor: "pointer", borderRadius: 6 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

			{/* Правая колонка: Предпросмотр (Canvas) */}
			<div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column" }}>
			  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>Предпросмотр шаблона</h3>
			  
			  <div style={{ 
				flex: 1, 
				width: "100%", 
				minHeight: "500px",
				display: "flex",
				alignItems: "flex-start", // Прижимаем к верху
				justifyContent: "center",
				background: "#F1F5F9", // Серый фон вокруг "листа"
				borderRadius: 12,
				padding: "20px",
				overflow: "auto"
			  }}>
				<div style={{ 
				  width: "100%",
				  maxWidth: "100%",
				  // Убираем фиксированный aspectRatio, картинка сама определит высоту
				  backgroundImage: editorBgUrl ? `url(${editorBgUrl})` : "none",
				  backgroundColor: editorBgUrl ? "transparent" : "#E2E8F0",
				  backgroundSize: "contain", // Важно: картинка целиком
				  backgroundRepeat: "no-repeat",
				  backgroundPosition: "center top",
				  position: "relative",
				  borderRadius: 4,
				  boxShadow: editorBgUrl ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
				  
				  /* Хак для сохранения пропорций контейнера в зависимости от картинки */
				  aspectRatio: "auto", 
				  // Если картинка загружена, используем JS для подстройки высоты контейнера 
				  // (или можно просто использовать img как подложку)
				}}>
				  {/* Скрытая картинка-невидимка, которая будет растягивать контейнер правильно */}
				  {editorBgUrl ? (
					<img 
					  src={editorBgUrl} 
					  style={{ width: "100%", display: "block", visibility: "hidden" }} 
					  alt="sizer" 
					/>
				  ) : (
					<div style={{ height: 600, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
					  Загрузите фон
					</div>
				  )}

				  {/* Слой с текстом */}
				  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
					{editorElements.map(el => (
					  <div 
						key={el.id}
						style={{
						  position: "absolute",
						  left: `${el.x}%`,
						  top: `${el.y}%`,
						  transform: "translate(-50%, -50%)",
						  fontSize: `${el.size}px`,
						  color: el.color,
						  fontWeight: el.weight,
						  whiteSpace: "pre-wrap",
						  textAlign: "center",
						  pointerEvents: "none",
						  lineHeight: 1.2
						}}
					  >
						{el.text}
					  </div>
					))}
				  </div>
				</div>
			  </div>
			  <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 16, textAlign: "center" }}>
				Используйте ползунки X и Y, чтобы расположить текст точно на фоне.
			  </p>
			</div>

          </div>
        )}
      </div>
    </div>
  );
}