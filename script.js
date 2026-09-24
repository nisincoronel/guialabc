let pedidoActual = [];

let determinaciones = [];
let determinacionesUnicas = [];

// Normaliza el JSON maestro al formato que ya utiliza la interfaz.
// Los 16 campos quedan disponibles desde el inicio, aunque estén vacíos.
function normalizarDeterminacion(d) {
    return {
        id: d["ID"] ?? "",
        nombre: d["Determinación"] ?? "",
        area: d["Grupo"] ?? "",
        integrantes: d["Integrantes"] ?? "",
        muestra: d["Muestra"] ?? "",
        tubo: d["Tubo"] ?? "",
        aditivo: d["Aditivo"] ?? "",
        sector: d["Sector"] ?? "",
        toma: d["Toma"] ?? "",
        procesamiento: d["Procesamiento"] ?? "",
        volumenAproximado: d["Volumen aproximado"] ?? "",
        ayuno: d["Ayuno"] ?? "",
        urgencia: d["Urgencia"] ?? "",
        prepPaciente: d["Condiciones especiales"] ?? "",
        obs: d["Observaciones"] ?? "",
        sinonimos: d["Sinónimos"] ?? "",
        nbu: d["NBU"] ?? d["Código NBU"] ?? "",

        // Compatibilidad con la lógica técnica existente.
        centrifugar: d["Centrifugar"] ?? "",
        separar: d["Separar"] ?? "",
        obsTecnicas: d["Observaciones técnicas"] ?? ""
    };
}

function escaparHTML(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function filaDato(etiqueta, valor) {
    if (!valor) return "";
    return `<strong>${escaparHTML(etiqueta)}:</strong> ${escaparHTML(valor)}<br>`;
}

async function cargarDeterminaciones() {
    try {
        const response = await fetch("determinaciones.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const datos = await response.json();
        
        console.log("JSON cargado:", datos);
console.log("Cantidad:", datos.length);

        if (!Array.isArray(datos)) {
            throw new Error("El JSON no contiene una lista de determinaciones.");
        }

        determinaciones = datos.map(normalizarDeterminacion);

        // Mantiene el comportamiento actual:
        // una ficha por nombre, conservando la primera aparición.
        determinacionesUnicas = Array.from(
            new Map(
                determinaciones.map(d => [d.nombre, d])
            ).values()
        ).filter(
            d => d.nombre !== "Anticoagulante Lúpico"
        );

        const stat = document.getElementById("statDeterminaciones");
        if (stat) stat.textContent = determinacionesUnicas.length;

        render();

    } catch (error) {

        console.error(
            "Error cargando determinaciones:",
            error
        );

        const list = document.getElementById("examList");
        const resultsSummary =
            document.getElementById("resultsSummary");

        if (list) {
            list.innerHTML = `
                <li style="cursor: default;">
                    <div>
                        <strong>
                            No se pudieron cargar las determinaciones.
                        </strong>
                        <br>
                        <small>
                            Verificá que exista el archivo
                            <code>datos/determinaciones.json</code>.
                        </small>
                    </div>
                </li>
            `;
        }

        if (resultsSummary) {
            resultsSummary.textContent =
                "Error al cargar la base de determinaciones.";
        }
    }
}


// ============================================================
// PEDIDO
// ============================================================

if (!document.getElementById("pedido-status")) {

    const pedidoHTML = `
        <div id="pedido-status" class="pedido-container">

            <span>
                <i class="fas fa-clipboard-list"></i>
                Pedido:
                <strong id="contador-pedido">0</strong>
            </span>

            <div>

                <button
                    onclick="enviarWhatsApp()"
                    class="btn-ws"
                >
                    <i class="fab fa-whatsapp"></i>
                    Enviar Indicaciones
                </button>

                <button
                    onclick="vaciarPedido()"
                    class="btn-clear"
                >
                    <i class="fas fa-trash"></i>
                </button>

            </div>

        </div>
    `;

    document
        .querySelector(".search-section")
        .insertAdjacentHTML(
            "beforebegin",
            pedidoHTML
        );
}


// ============================================================
// RENDERIZADO
// ============================================================

function render() {

    const list =
        document.getElementById("examList");

    const search =
        document.getElementById("searchInput")
            .value
            .toLowerCase();

    const areaFilter =
        document.getElementById("areaSelect")
            .value;

    const learningHub =
        document.getElementById("learningHub");

    const resultsSummary =
        document.getElementById("resultsSummary");

    list.innerHTML = "";

    const isBrowsing =
        search.trim() !== "" ||
        areaFilter !== "";

    learningHub.hidden = isBrowsing;

    resultsSummary.textContent = "";

    if (!isBrowsing) return;


    // --------------------------------------------------------
    // FILTRADO
    // --------------------------------------------------------

    const filtered =
        determinacionesUnicas.filter(d => {

            const searchableText = [

                d.nombre,

                d.area,

                d.sector,

                d.muestra,

                d.tubo,

                d.toma,

                d.integrantes,

                d.sinonimos,

                d.nbu

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchText =
                searchableText.includes(search);


            const matchArea =
                areaFilter === "" ||
                d.area === areaFilter;


            return matchText && matchArea;
        });


    if (filtered.length === 0) {

        resultsSummary.textContent =
            "No encontramos estudios con esos criterios. " +
            "Probá con otro nombre, tubo o sector.";

        return;
    }


    resultsSummary.textContent =
        `${filtered.length} ${
            filtered.length === 1
                ? "estudio encontrado"
                : "estudios encontrados"
        }`;


    filtered.forEach(d => {

        const li =
            document.createElement("li");


        // ----------------------------------------------------
        // COLOR DEL TUBO
        // ----------------------------------------------------

        let claseTubo =
            "color-rojo";

        const tuboTexto =
            (d.tubo || "").toLowerCase();


        if (
            tuboTexto.includes("lila") ||
            tuboTexto.includes("edta")
        ) {

            claseTubo =
                "color-lila";

        } else if (
            tuboTexto.includes("celeste") ||
            tuboTexto.includes("citrato 1:9")
        ) {

            claseTubo =
                "color-celeste";

        } else if (
            tuboTexto.includes("negro") ||
            tuboTexto.includes("citrato 1:4")
        ) {

            claseTubo =
                "color-negro";

        } else if (
            tuboTexto.includes("verde") ||
            tuboTexto.includes("heparina")
        ) {

            claseTubo =
                "color-verde";

        } else if (
            tuboTexto.includes("frasco") ||
            tuboTexto.includes("estéril") ||
            tuboTexto.includes("materia")
        ) {

            claseTubo =
                "color-esteril";
        }


        // ----------------------------------------------------
        // URGENCIA
        // ----------------------------------------------------

        const nivelUrgencia =
            d.urgencia
                ? d.urgencia.toLowerCase()
                : "baja";


        const claseUrgencia =
            `urgencia-${nivelUrgencia}`;


        // ----------------------------------------------------
        // TARJETA
        // ----------------------------------------------------

        li.innerHTML = `

            <div class="wrapper-izquierdo">

                <span
                    class="tubo-color ${claseTubo}"
                ></span>

                <div>

                    <strong
                        style="
                            display: inline-block;
                            margin-bottom: 2px;
                        "
                    >
                        ${d.nombre}
                    </strong>

                    <span
                        class="badge ${claseUrgencia}"
                    >
                        ${d.urgencia || "Rutina"}
                    </span>

                    <br>

                    <small
                        style="
                            color: #64748b;
                            font-weight: 500;
                        "
                    >

                        <i
                            class="fas fa-tags"
                            style="
                                font-size: 0.75rem;
                            "
                        ></i>

                        ${d.area}
                        ${d.nbu ? `<span class="nbu-mini">NBU ${escaparHTML(d.nbu)}</span>` : ""}

                    </small>

                </div>

            </div>

            <i
                class="fas fa-chevron-right"
                style="
                    color: #cbd5e1;
                    font-size: 0.9rem;
                "
            ></i>
        `;


        li.onclick = () =>
            mostrarDetalle(d);


        list.appendChild(li);
    });
}


// ============================================================
// MODO ESTUDIANTE · TARJETAS DE REPASO
// ============================================================

function crearDesafioEstudiante(d) {
    const respuestas = [
        { icono: "fa-vial", pregunta: "¿Qué muestra biológica utilizarías?", respuesta: d.muestra || "La base no especifica una muestra." },
        { icono: "fa-droplet", pregunta: "¿Qué tubo corresponde?", respuesta: d.tubo || "La base no especifica el tubo." },
        { icono: "fa-utensils", pregunta: "¿Requiere ayuno o alguna preparación especial?", respuesta: d.ayuno || d.prepPaciente || "No se especifica ayuno o preparación especial." },
        { icono: "fa-gears", pregunta: "¿Cómo debe procesarse o conservarse?", respuesta: d.procesamiento || "La base no especifica el procesamiento." }
    ];

    return `
        <section class="student-challenge" aria-label="Tarjetas de repaso">
            <div class="student-challenge-head">
                <div class="student-challenge-badge"><i class="fas fa-graduation-cap"></i></div>
                <div>
                    <span class="student-overline">Modo estudiante</span>
                    <h3>Antes de mirar la ficha...</h3>
                    <p>Intentá responder y revelá cada dato cuando estés listo.</p>
                </div>
            </div>
            <div class="student-question-list">
                ${respuestas.map(item => `
                    <article class="student-question">
                        <div class="student-question-icon"><i class="fas ${item.icono}"></i></div>
                        <div class="student-question-body"><strong>${escaparHTML(item.pregunta)}</strong><div class="student-answer" hidden>${escaparHTML(item.respuesta)}</div></div>
                        <button type="button" class="reveal-answer" onclick="revelarRespuestaEstudiante(this)"><i class="fas fa-eye"></i><span>Revelar</span></button>
                    </article>`).join("")}
            </div>
            <div class="student-challenge-actions">
                <button type="button" class="student-reveal-all" onclick="revelarTodasRespuestas()"><i class="fas fa-lightbulb"></i> Revelar todas</button>
                <button type="button" class="student-see-file" onclick="mostrarFichaCompletaEstudiante()">Ver ficha completa <i class="fas fa-arrow-down"></i></button>
            </div>
        </section>`;
}

function revelarRespuestaEstudiante(button) {
    const answer = button.closest(".student-question")?.querySelector(".student-answer");
    if (!answer) return;
    const visible = !answer.hidden;
    answer.hidden = visible;
    button.classList.toggle("revealed", !visible);
    button.innerHTML = visible ? '<i class="fas fa-eye"></i><span>Revelar</span>' : '<i class="fas fa-eye-slash"></i><span>Ocultar</span>';
}

function revelarTodasRespuestas() {
    document.querySelectorAll(".student-question").forEach(question => {
        const answer = question.querySelector(".student-answer");
        const button = question.querySelector(".reveal-answer");
        if (answer) answer.hidden = false;
        if (button) { button.classList.add("revealed"); button.innerHTML = '<i class="fas fa-eye-slash"></i><span>Ocultar</span>'; }
    });
}

// ============================================================
// DETALLE
// ============================================================

function mostrarDetalle(d) {

    const modal =
        document.getElementById("modal");

    const modalData =
        document.getElementById("modalData");

    const modoEstudianteActivo =
        document.body.classList.contains("student-mode-active");

    const centrifugado =
        d.centrifugar
            ? d.centrifugar
            : "No requiere / No especifica";


    const separacion =
        d.separar
            ? d.separar
            : "No requiere / No especifica";


    // --------------------------------------------------------
    // COLOR DEL TUBO
    // --------------------------------------------------------

    let claseTuboModal =
        "color-rojo";


    const tTexto =
        (d.tubo || "").toLowerCase();


    if (
        tTexto.includes("lila") ||
        tTexto.includes("edta")
    ) {

        claseTuboModal =
            "color-lila";

    } else if (
        tTexto.includes("celeste")
    ) {

        claseTuboModal =
            "color-celeste";

    } else if (
        tTexto.includes("negro")
    ) {

        claseTuboModal =
            "color-negro";

    } else if (
        tTexto.includes("verde")
    ) {

        claseTuboModal =
            "color-verde";

    } else if (
        tTexto.includes("frasco") ||
        tTexto.includes("estéril") ||
        tTexto.includes("materia")
    ) {

        claseTuboModal =
            "color-esteril";
    }


    // --------------------------------------------------------
    // MODAL
    // --------------------------------------------------------

    modalData.innerHTML = `

        <div
            class="modal-header-analisis"
            style="margin-bottom: 12px;"
        >

            <h2 class="modal-title">
                ${d.nombre}
            </h2>


            <div
                style="
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    margin-top: 6px;
                    flex-wrap: wrap;
                "
            >

                <span class="modal-sector">
                    ${d.area}
                </span>

                ${d.nbu ? `<span class="nbu-chip"><i class="fas fa-hashtag"></i> NBU ${escaparHTML(d.nbu)}</span>` : ""}

                <span
                    style="
                        font-size: 0.85rem;
                        font-weight: 700;
                        color: #475569;
                        display: inline-flex;
                        align-items: center;
                    "
                >

                    <span
                        class="tubo-color ${claseTuboModal}"
                        style="margin-right: 6px;"
                    ></span>

                    ${d.tubo}

                </span>

            </div>

        </div>

        ${modoEstudianteActivo ? crearDesafioEstudiante(d) : ""}

        <div class="student-reference-wrap" id="studentReferenceWrap" style="${modoEstudianteActivo ? "display:none" : "display:block"};">

        <!-- PESTAÑAS -->

        <div class="modal-tabs">

            <button
                class="tab-btn active tab-paciente"
                onclick="cambiarPestaña('paciente')"
            >
                <i class="fas fa-user"></i>
                Paciente
            </button>


            <button
                class="tab-btn tab-tecnico"
                onclick="cambiarPestaña('tecnico')"
            >
                <i class="fas fa-flask"></i>
                Técnico
            </button>

        </div>


        <!-- PACIENTE -->

        <div
            id="tab-paciente-content"
            class="tab-content active"
        >

            <div
                class="seccion-modal-paciente"
                style="margin-bottom: 16px;"
            >

                <h3
                    class="modal-subtitulo paciente"
                    style="margin-bottom: 8px;"
                >

                    <i class="fas fa-user-check"></i>

                    Preparación y Ayuno

                </h3>


                <p class="modal-texto">

                    <strong>
                        Ayuno requerido:
                    </strong>

                    ${
                        d.ayuno ||
                        "No requiere ayuno."
                    }

                    <br><br>

                    ${
                        d.prepPaciente ||
                        `${d.toma} ${d.ayuno || ""}`
                    }

                </p>

            </div>

        </div>


        <!-- TÉCNICO -->

        <div
            id="tab-tecnico-content"
            class="tab-content"
        >

            <div
                class="seccion-modal-tecnico"
                style="margin-bottom: 16px;"
            >

                <h3
                    class="modal-subtitulo tecnico"
                    style="margin-bottom: 8px;"
                >

                    <i class="fas fa-vial"></i>

                    Control de Procesamiento

                </h3>


                <p class="modal-texto">

                    ${filaDato(
                        "Muestra biológica",
                        d.muestra
                    )}

                    ${filaDato(
                        "Tubo",
                        d.tubo
                    )}

                    ${filaDato(
                        "Aditivo",
                        d.aditivo
                    )}

                    ${filaDato(
                        "Volumen aproximado",
                        d.volumenAproximado
                    )}

                    ${filaDato(
                        "Toma",
                        d.toma
                    )}

                    ${filaDato(
                        "Centrifugar",
                        centrifugado
                    )}

                    ${filaDato(
                        "Separar suero/plasma",
                        separacion
                    )}

                    ${filaDato(
                        "Estabilidad / Conservación",
                        d.procesamiento ||
                        "No especifica."
                    )}

                </p>


                ${
                    d.integrantes
                        ? `
                            <div
                                class="dato-complementario"
                                style="margin-top: 12px;"
                            >
                                <strong>
                                    Integrantes:
                                </strong>

                                ${
                                    escaparHTML(
                                        d.integrantes
                                    )
                                }
                            </div>
                        `
                        : ""
                }


                ${
                    d.sinonimos
                        ? `
                            <div
                                class="dato-complementario"
                                style="margin-top: 8px;"
                            >

                                <strong>
                                    Sinónimos:
                                </strong>

                                ${
                                    escaparHTML(
                                        d.sinonimos
                                    )
                                }

                            </div>
                        `
                        : ""
                }


                ${
                    d.obsTecnicas || d.obs
                        ? `
                            <div
                                class="alerta-tecnica"
                                style="
                                    margin-top: 12px;
                                    background-color: #fffbeb;
                                    border: 1px solid #fef3c7;
                                    color: #92400e;
                                    font-size: 0.8rem;
                                    padding: 10px;
                                    border-radius: 8px;
                                "
                            >

                                <i
                                    class="fas fa-exclamation-triangle"
                                ></i>

                                <strong>
                                    Manejo de Mesada:
                                </strong>

                                ${
                                    escaparHTML(
                                        d.obsTecnicas ||
                                        d.obs
                                    )
                                }

                            </div>
                        `
                        : ""
                }

            </div>

        </div>

        </div><!-- /student-reference-wrap -->


        <!-- BOTÓN PEDIDO -->

        <button
            onclick='agregarAlPedido(${JSON.stringify(d).replace(/"/g, "&quot;")})'
            class="btn-whatsapp-premium"
            style="
                background-color: var(--primary);
                box-shadow:
                    0 4px 12px
                    rgba(2, 132, 199, 0.2);
            "
        >

            <i class="fas fa-plus"></i>

            Añadir a la Orden de WhatsApp

        </button>

    `;


    modal.style.display =
        "flex";
}


// ============================================================
// PESTAÑAS
// ============================================================

function cambiarPestaña(tipo) {

    const btnPaciente =
        document.querySelector(
            ".tab-btn.tab-paciente"
        );

    const btnTecnico =
        document.querySelector(
            ".tab-btn.tab-tecnico"
        );

    const contentPaciente =
        document.getElementById(
            "tab-paciente-content"
        );

    const contentTecnico =
        document.getElementById(
            "tab-tecnico-content"
        );


    if (tipo === "paciente") {

        btnPaciente.classList.add("active");

        contentPaciente.classList.add("active");

        btnTecnico.classList.remove("active");

        contentTecnico.classList.remove("active");

    } else {

        btnTecnico.classList.add("active");

        contentTecnico.classList.add("active");

        btnPaciente.classList.remove("active");

        contentPaciente.classList.remove("active");
    }
}


// ============================================================
// PEDIDO / WHATSAPP
// ============================================================

function agregarAlPedido(estudio) {

    if (
        !pedidoActual.some(
            e => e.nombre === estudio.nombre
        )
    ) {

        pedidoActual.push(estudio);

        actualizarInterfaz();
    }

    cerrarModal();
}


function actualizarInterfaz() {

    const status =
        document.getElementById(
            "pedido-status"
        );

    document.getElementById(
        "contador-pedido"
    ).innerText =
        pedidoActual.length;


    status.style.display =
        pedidoActual.length > 0
            ? "flex"
            : "none";
}


function vaciarPedido() {

    pedidoActual = [];

    actualizarInterfaz();
}


function enviarWhatsApp() {

    if (
        pedidoActual.length === 0
    ) return;


    let mensaje =
        "*GUÍALAB - INDICACIONES PARA TUS ESTUDIOS* 🔬\n";

    mensaje +=
        "========================================\n\n";

    mensaje +=
        "Hola, para garantizar la validez de los resultados de tus análisis clínicos, por favor seguí minuciosamente estas instrucciones previas:\n\n";


    pedidoActual.forEach(
        (est, index) => {

            mensaje +=
                `📌 *${est.nombre.toUpperCase()}*\n`;


            if (est.prepPaciente) {

                mensaje +=
                    `• *Preparación:* ${est.prepPaciente}\n`;


                if (
                    est.ayuno &&
                    est.ayuno.toLowerCase() !==
                        "no requiere"
                ) {

                    mensaje +=
                        `• *Ayuno:* ${est.ayuno}\n`;
                }

            } else {

                mensaje +=
                    `• *Preparación:* ${est.toma} ${est.ayuno || ""}\n`;


                if (est.obs) {

                    mensaje +=
                        `• *Nota Importante:* ${est.obs}\n`;
                }
            }


            mensaje +=
                "----------------------------------------\n";
        }
    );


    mensaje +=
        "\n📍 *Posadas, Misiones*\n";


    mensaje +=
        "_Recordá presentarte en el horario de extracción asignado con tu DNI y la Orden Médica correspondiente._";


    const textoCodificado =
        encodeURIComponent(mensaje);


    window.open(
        `https://wa.me/?text=${textoCodificado}`,
        "_blank"
    );
}


// ============================================================
// DESCARGA TXT
// ============================================================

function descargarTXT() {

    if (
        pedidoActual.length === 0
    ) return;


    let texto =
        "========================================\n";

    texto +=
        "   GUÍALAB - INDICACIONES DE LABORATORIO\n";

    texto +=
        "========================================\n\n";

    texto +=
        "Hola, para garantizar la validez de los resultados de tus análisis clínicos, por favor seguí minuciosamente estas instrucciones previas:\n\n";


    pedidoActual.forEach(
        (est, index) => {

            texto +=
                `📌 [${index + 1}] ${est.nombre.toUpperCase()}\n`;


            if (est.prepPaciente) {

                texto +=
                    `   • Preparación: ${est.prepPaciente}\n`;


                if (
                    est.ayuno &&
                    est.ayuno.toLowerCase() !==
                        "no requiere"
                ) {

                    texto +=
                        `   • Ayuno: ${est.ayuno}\n`;
                }

            } else {

                texto +=
                    `   • Preparación: ${est.toma} ${est.ayuno || ""}\n`;


                if (est.obs) {

                    texto +=
                        `   • Nota Importante: ${est.obs}\n`;
                }
            }


            texto +=
                "----------------------------------------\n";
        }
    );


    texto +=
        "\n📍 Posadas, Misiones\n";


    texto +=
        "Recordá presentarte en el horario de extracción asignado con tu DNI y la Orden Médica correspondiente.";


    const blob =
        new Blob(
            [texto],
            {
                type:
                    "text/plain;charset=utf-8"
            }
        );


    const enlace =
        document.createElement("a");


    enlace.href =
        URL.createObjectURL(blob);


    enlace.download =
        "indicaciones-laboratorio.txt";


    document.body.appendChild(
        enlace
    );


    enlace.click();


    document.body.removeChild(
        enlace
    );


    URL.revokeObjectURL(
        enlace.href
    );
}


// ============================================================
// CIERRE DEL MODAL
// ============================================================

function cerrarModal() {

    document.getElementById(
        "modal"
    ).style.display =
        "none";
}


document.getElementById(
    "closeModal"
).onclick =
    cerrarModal;


window.onclick = (e) => {

    if (
        e.target ==
        document.getElementById("modal")
    ) {

        cerrarModal();
    }
};


// ============================================================
// EVENTOS DE BÚSQUEDA
// ============================================================

document
    .getElementById("searchInput")
    .addEventListener(
        "input",
        render
    );


document
    .getElementById("areaSelect")
    .addEventListener(
        "change",
        render
    );


document
    .querySelectorAll("[data-sector]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document.getElementById(
                    "areaSelect"
                ).value =
                    button.dataset.sector;


                document.getElementById(
                    "searchInput"
                ).value =
                    "";


                render();


                document
                    .getElementById(
                        "examList"
                    )
                    .scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
            }
        );
    });



// ============================================================
// MODO ESTUDIANTE
// ============================================================

const studentModeButton = document.getElementById("studentModeButton");
const studentModePanel = document.getElementById("studentModePanel");

function activarModoEstudiante() {
    const activo = document.body.classList.toggle("student-mode-active");

    if (studentModeButton) {
        studentModeButton.setAttribute("aria-pressed", String(activo));
        const icon = studentModeButton.querySelector(".guide-toggle i");
        if (icon) icon.className = activo ? "fas fa-toggle-on" : "fas fa-toggle-off";
    }

    if (studentModePanel) studentModePanel.hidden = !activo;

    const input = document.getElementById("searchInput");
    if (activo && input) {
        setTimeout(() => input.focus(), 120);
    }
}

function mostrarFichaCompletaEstudiante() {
    const wrap = document.getElementById("studentReferenceWrap");
    const reveal = document.querySelector(".student-challenge");
    if (!wrap) return;
    wrap.style.display = "block";
    if (reveal) reveal.remove();
    wrap.scrollIntoView({ behavior: "smooth", block: "start" });
}

if (studentModeButton) {
    studentModeButton.addEventListener("click", activarModoEstudiante);
}

// ============================================================
// CARGA DE LA BASE EXTERNA
// ============================================================

cargarDeterminaciones();
