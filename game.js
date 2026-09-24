(() => {
    'use strict';

    const TOTAL_QUESTIONS = 10;
    const DATA_URL = 'determinaciones.json';
    const content = document.getElementById('gameContent');
    const startButton = document.getElementById('startGame');
    const bestScore = document.getElementById('bestScore');
    let records = [];
    let questions = [];
    let state = { index: 0, score: 0, correct: 0, streak: 0, bestStreak: 0, answered: false };

    const fields = [
        { key: 'Muestra', label: '¿Qué muestra corresponde?', icon: 'fa-vial' },
        { key: 'Tubo', label: '¿Qué tubo corresponde?', icon: 'fa-droplet' },
        { key: 'Aditivo', label: '¿Qué aditivo corresponde?', icon: 'fa-flask' },
        { key: 'Ayuno', label: '¿Qué indicación de ayuno requiere?', icon: 'fa-utensils' },
        { key: 'Procesamiento', label: '¿Qué indicación de procesamiento o conservación corresponde?', icon: 'fa-gears' },
        { key: 'Grupo', label: '¿A qué grupo pertenece?', icon: 'fa-layer-group' },
        { key: 'Toma', label: '¿Qué indicación de toma corresponde?', icon: 'fa-syringe' },
        { key: 'Volumen aproximado', label: '¿Qué volumen aproximado se solicita?', icon: 'fa-ruler-combined' }
    ];

    function text(value) {
        return String(value ?? '').replace(/\s+/g, ' ').trim();
    }

    function escapeHTML(value) {
        return text(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function shuffle(list) {
        return [...list].sort(() => Math.random() - 0.5);
    }

    function bestLabel() {
        const saved = Number(localStorage.getItem('guialabChallengeBest') || 0);
        if (!saved) return;
        bestScore.hidden = false;
        bestScore.innerHTML = `<i class="fas fa-trophy"></i> Mejor puntaje: <strong>${saved}</strong>`;
    }

    function prepareRecords(data) {
        return data.map(item => {
            const record = { name: text(item['Determinación']) };
            fields.forEach(field => { record[field.key] = text(item[field.key]); });
            return record;
        }).filter(record => record.name);
    }

    function optionsFor(field, answer) {
        const choices = [...new Set(records.map(record => record[field.key]).filter(Boolean))]
            .filter(value => value !== answer);
        if (choices.length < 3) return null;
        return shuffle([...shuffle(choices).slice(0, 3), answer]);
    }

    function generateQuestions() {
        const candidates = [];
        records.forEach(record => fields.forEach(field => {
            const answer = record[field.key];
            const options = answer && optionsFor(field, answer);
            if (options) candidates.push({ record, field, answer, options });
        }));
        return shuffle(candidates).slice(0, Math.min(TOTAL_QUESTIONS, candidates.length));
    }

    function renderQuestion() {
        const question = questions[state.index];
        const progress = Math.round((state.index / questions.length) * 100);
        content.innerHTML = `
            <div class="game-topbar">
                <div><span class="eyebrow">Desafío en curso</span><strong>Pregunta ${state.index + 1} de ${questions.length}</strong></div>
                <div class="score-pill"><i class="fas fa-star"></i> ${state.score}</div>
            </div>
            <div class="progress-track"><span style="width:${progress}%"></span></div>
            <div class="streak-row"><span><i class="fas fa-fire"></i> Racha: <strong>${state.streak}</strong></span><span><i class="fas fa-flask"></i> Datos reales</span></div>
            <div class="question-card">
                <span class="question-icon"><i class="fas ${question.field.icon}"></i></span>
                <p class="question-name">${escapeHTML(question.record.name)}</p>
                <h1>${escapeHTML(question.field.label)}</h1>
            </div>
            <div class="options" id="options">
                ${question.options.map((option, index) => `<button type="button" data-index="${index}"><span>${String.fromCharCode(65 + index)}</span>${escapeHTML(option)}</button>`).join('')}
            </div>
            <div id="feedback" class="feedback" hidden></div>`;
        document.querySelectorAll('#options button').forEach(button => button.addEventListener('click', () => answer(Number(button.dataset.index))));
    }

    function answer(index) {
        if (state.answered) return;
        state.answered = true;
        const question = questions[state.index];
        const chosen = question.options[index];
        const correct = chosen === question.answer;
        const buttons = document.querySelectorAll('#options button');
        buttons.forEach((button, buttonIndex) => {
            button.disabled = true;
            if (question.options[buttonIndex] === question.answer) button.classList.add('correct');
            if (buttonIndex === index && !correct) button.classList.add('incorrect');
        });
        if (correct) {
            state.correct += 1;
            state.streak += 1;
            state.bestStreak = Math.max(state.bestStreak, state.streak);
            state.score += 100 + Math.max(0, state.streak - 1) * 25;
        } else {
            state.streak = 0;
        }
        const feedback = document.getElementById('feedback');
        feedback.hidden = false;
        feedback.className = `feedback ${correct ? 'positive' : 'negative'}`;
        feedback.innerHTML = `<strong>${correct ? '¡Excelente!' : 'Casi.'}</strong><span>${correct ? `Sumaste puntos por tu racha de ${state.streak}.` : `La respuesta correcta era: ${escapeHTML(question.answer)}.`}</span><button type="button" id="nextQuestion">${state.index + 1 === questions.length ? 'Ver resultados' : 'Siguiente'} <i class="fas fa-arrow-right"></i></button>`;
        document.getElementById('nextQuestion').addEventListener('click', nextQuestion);
    }

    function nextQuestion() {
        if (state.index + 1 >= questions.length) return renderResults();
        state.index += 1;
        state.answered = false;
        renderQuestion();
    }

    function renderResults() {
        const previousBest = Number(localStorage.getItem('guialabChallengeBest') || 0);
        const isNewBest = state.score > previousBest;
        if (isNewBest) localStorage.setItem('guialabChallengeBest', String(state.score));
        content.innerHTML = `
            <div class="result-screen">
                <span class="result-icon"><i class="fas ${isNewBest ? 'fa-trophy' : 'fa-medal'}"></i></span>
                <span class="eyebrow">Desafío terminado</span>
                <h1>${isNewBest ? '¡Nuevo récord!' : '¡Muy bien!'}</h1>
                <p>Tu puntaje final</p>
                <strong class="final-score">${state.score}</strong>
                <div class="result-grid"><div><i class="fas fa-check"></i><strong>${state.correct}/${questions.length}</strong><small>respuestas correctas</small></div><div><i class="fas fa-fire"></i><strong>${state.bestStreak}</strong><small>mejor racha</small></div></div>
                <p class="result-message">${state.score >= 850 ? 'Excelente dominio de la pre-analítica.' : state.score >= 450 ? 'Vas muy bien: una ronda más y seguís afianzando conocimientos.' : 'Cada ronda es una nueva oportunidad para practicar.'}</p>
                <button class="primary-button" id="playAgain"><i class="fas fa-rotate-right"></i> Jugar otra vez</button>
                <a class="return-button" href="index.html"><i class="fas fa-arrow-left"></i> Volver a GuíaLab</a>
            </div>`;
        document.getElementById('playAgain').addEventListener('click', startGame);
    }

    function startGame() {
        questions = generateQuestions();
        if (!questions.length) {
            content.innerHTML = '<div class="error-screen"><i class="fas fa-triangle-exclamation"></i><h1>No se pudieron crear preguntas.</h1><a href="index.html">Volver a GuíaLab</a></div>';
            return;
        }
        state = { index: 0, score: 0, correct: 0, streak: 0, bestStreak: 0, answered: false };
        renderQuestion();
    }

    async function loadData() {
        try {
            const response = await fetch(DATA_URL, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('Formato de datos inválido');
            records = prepareRecords(data);
            if (!records.length) throw new Error('Sin determinaciones disponibles');
            startButton.disabled = false;
            bestLabel();
        } catch (error) {
            content.innerHTML = '<div class="error-screen"><i class="fas fa-triangle-exclamation"></i><h1>No pudimos cargar la guía.</h1><p>Verificá la conexión o abrí el sitio publicado.</p><a href="index.html">Volver a GuíaLab</a></div>';
            console.error(error);
        }
    }

    startButton.addEventListener('click', startGame);
    startButton.disabled = true;
    loadData();
})();
