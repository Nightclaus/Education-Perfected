// ==UserScript==
// @name         Education Impacted (Polished + Edgecase Fix)
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Automated completion for Education Perfect vocabulary tasks with learning capabilities.
// @author       Nightclaus
// @match        https://app.educationperfect.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    if (window.top !== window.self && window.innerWidth < 100) return;

    let wordDictionary = {};
    let solverActive = false;
    let mainLoop = null;

    // --- 1. CSS Styles ---
    const injectStyles = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            #ep-helper-wrapper {
                position: fixed !important; top: 15% !important; right: 0 !important;
                z-index: 2147483647; display: flex; transition: transform 0.4s ease;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            .collapsed { transform: translateX(300px); }
            #ep-sidebar {
                display: flex; flex-direction: column; background: #1a1a1a; 
                border: 2px solid #ff4d4d; border-right: none; 
                border-radius: 10px 0 0 10px; overflow: hidden; box-shadow: -2px 0 10px rgba(0,0,0,0.5);
            }
            #ep-toggle-btn {
                color: #ff4d4d; padding: 15px 12px; cursor: pointer; font-weight: bold; 
                font-size: 20px; text-align: center; border-bottom: 1px solid #333;
            }
            .tab-icon {
                writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg); 
                color: #666; font-size: 11px; font-weight: bold; text-transform: uppercase; 
                cursor: pointer; padding: 20px 10px; transition: 0.2s; border-bottom: 1px solid #333;
            }
            .tab-icon.active { color: #ff4d4d; background: #0a0a0a; }
            #ep-main-panel {
                width: 300px; background: #0a0a0a; color: #ffffff; border: 2px solid #333; 
                border-left: none; height: 560px; display: flex; flex-direction: column; 
                padding: 20px; box-sizing: border-box;
            }
            .panel-header h1 { font-size: 20px; margin: 0; color: #ff4d4d; text-transform: uppercase; }
            .panel-header p { margin-bottom: 10px; font-size: 12px; color: #888; font-style: italic; }
            .action-btn {
                background-color: #ff4d4d; color: #ffffff; border: none; padding: 10px; 
                cursor: pointer; border-radius: 4px; font-weight: bold; width: 100%; text-transform: uppercase;
            }
            .action-btn:disabled { background: #444; opacity: 0.6; }
            .settings-section { margin-top: 12px; border-top: 1px solid #333; padding-top: 8px; }
            .setting-label { font-size: 10px; color: #aaa; margin-bottom: 4px; display: block; letter-spacing: 0.5px; }
            .slider-container { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
            .range-slider { flex-grow: 1; accent-color: #ff4d4d; cursor: pointer; height: 4px; }
            .ui-disabled { opacity: 0.2; pointer-events: none; }
            #dictionary-display {
                margin-top: 10px; border-top: 1px solid #444; overflow-y: auto; 
                flex-grow: 1; display: none; min-height: 0;
            }
            .word-pair { padding: 6px 0; border-bottom: 1px solid #222; display: flex; justify-content: space-between; font-size: 11px; }
            .word-pair .key { color: #ff4d4d; font-weight: bold; }
            .tab-content { display: none; flex-direction: column; flex-grow: 1; overflow: hidden; }
            .tab-content.active { display: flex; }
            .answer-preview-box { background: #111; padding: 15px; border: 1px solid #444; margin-top: 20px; text-align: center; }
        `;
        document.head.appendChild(style);
    };

    // --- 2. Build UI ---
    const uiContainer = document.createElement('div');
    uiContainer.id = 'ep-helper-wrapper';
    uiContainer.className = 'collapsed';
    uiContainer.innerHTML = `
        <div id="ep-sidebar">
            <div id="ep-toggle-btn"><</div>
            <div class="tab-icon active" data-target="dict">Dictionary</div>
            <div class="tab-icon" data-target="auto">Autosolver</div>
        </div>
        <div id="ep-main-panel">
            <div class="panel-header">
                <h1>Education Impacted</h1>
                <p>Makima is listening</p>
            </div>
            <div id="tab-dict" class="tab-content active">
                <button id="btn-scrape" class="action-btn">Create Dictionary</button>
                <p style="font-size: 10px; color: #ff4d4d; text-align: center; margin-top: 5px;">* Scroll to bottom first! *</p>
                <div id="dictionary-display"></div>
            </div>
            <div id="tab-auto" class="tab-content">
                <div class="settings-section">
                    <div class="answer-preview-box">
                        <label class="setting-label">Current Answer</label>
                        <div id="display-answer">Waiting...</div>
                    </div>
                </div>
                <div class="settings-section">
                    <div class="slider-container">
                         <input type="checkbox" id="check-autotype">
                         <label class="setting-label" style="margin:0; font-weight:bold; color:#ff4d4d;">Enable Autotyping</label>
                    </div>
                    <div id="typing-settings" class="ui-disabled">
                        <label class="setting-label">Delay + Random Offset (ms)</label>
                        <div class="slider-container">
                            <input type="range" id="input-delay" class="range-slider" min="0" max="1000" value="100">
                            <span id="val-delay" style="font-size:10px; width:30px;">100</span>
                        </div>
                        <div class="slider-container">
                            <input type="range" id="input-offset" class="range-slider" min="0" max="1000" value="0">
                            <span id="val-offset" style="font-size:10px; width:30px;">0</span>
                        </div>
                    </div>
                </div>
                <div style="flex-grow:1"></div>
                <button id="btn-toggle-solver" class="action-btn">Start Solver</button>
            </div>
        </div>
    `;

    injectStyles();
    document.body.appendChild(uiContainer);

    const elements = {
        wrapper: uiContainer,
        toggleBtn: document.getElementById('ep-toggle-btn'),
        scrapeBtn: document.getElementById('btn-scrape'),
        dictDisplay: document.getElementById('dictionary-display'),
        autoTypeCheck: document.getElementById('check-autotype'),
        typingSettings: document.getElementById('typing-settings'),
        startSolverBtn: document.getElementById('btn-toggle-solver'),
        ansPreview: document.getElementById('display-answer'),
        delayInput: document.getElementById('input-delay'),
        offsetInput: document.getElementById('input-offset'),
        delayVal: document.getElementById('val-delay'),
        offsetVal: document.getElementById('val-offset')
    };

    // --- 3. UI Logic ---
    elements.delayInput.oninput = () => elements.delayVal.innerText = elements.delayInput.value;
    elements.offsetInput.oninput = () => elements.offsetVal.innerText = elements.offsetInput.value;
    elements.autoTypeCheck.onchange = () => elements.typingSettings.classList.toggle('ui-disabled', !elements.autoTypeCheck.checked);
    
    elements.toggleBtn.onclick = () => {
        elements.wrapper.classList.toggle('collapsed');
        elements.toggleBtn.innerText = elements.wrapper.classList.contains('collapsed') ? '<' : '>';
    };

    document.querySelectorAll('.tab-icon').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.tab-icon, .tab-content').forEach(el => el.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.target).classList.add('active');
        };
    });

    // --- 4. Dictionary Logic ---
    const sanitize = (text) => text ? text.trim().split(';')[0] : null; // .replace(/'/g, '')

    elements.scrapeBtn.onclick = () => {
        const wordItems = document.querySelectorAll('.h-group.preview-grid-item-content.ng-scope');
        wordDictionary = {};
        elements.dictDisplay.innerHTML = '';

        wordItems.forEach(item => {
            const target = sanitize(item.querySelector('.targetLanguage')?.innerText);
            const base = sanitize(item.querySelector('.baseLanguage')?.innerText);
            
            if (target && base) {
                wordDictionary[target] = base;
                wordDictionary[base] = target;
                const row = document.createElement('div');
                row.className = 'word-pair';
                row.innerHTML = `<span class="key">${target}</span> : ${base}`;
                elements.dictDisplay.appendChild(row);
            }
        });
        elements.dictDisplay.style.display = 'block';
        elements.scrapeBtn.innerText = `REFRESH (${Math.floor(Object.keys(wordDictionary).length / 2)} words)`;
    };

    // --- 5. Solver Logic ---
    function runSolverStep() {
        if (!solverActive) return;

        // Learn from Correction Screen (The Edgecase)
        const missedQElement = document.getElementById('question-field');
        const correctAElement = document.getElementById('correct-answer-field');

        if (missedQElement && correctAElement) {
            const learnedQ = sanitize(missedQElement.innerText);
            const learnedA = sanitize(correctAElement.value || correctAElement.innerText); // value for inputs, innerText for spans
            
            if (learnedQ && learnedA && wordDictionary[learnedQ] !== learnedA) {
                wordDictionary[learnedQ] = learnedA;
                wordDictionary[learnedA] = learnedQ;
                console.log(`Learned: ${learnedQ} = ${learnedA}`);
            }
        }

        // Standard Solving
        const questionText = sanitize(document.querySelector('#question-text > span')?.innerText);
        const inputField = document.getElementById('answer-text');

        if (questionText && wordDictionary[questionText]) {
            const answer = wordDictionary[questionText];
            elements.ansPreview.innerText = answer;

            if (elements.autoTypeCheck.checked && inputField && inputField.value !== answer) {
                inputField.focus();
                document.execCommand('selectAll', false, null);
                document.execCommand('insertText', false, answer);
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }

    elements.startSolverBtn.onclick = () => {
        if (solverActive) {
            solverActive = false;
            clearInterval(mainLoop);
            elements.startSolverBtn.innerText = "Start Solver";
            elements.startSolverBtn.style.background = "#ff4d4d";
        } else {
            if (Object.keys(wordDictionary).length === 0) return alert("Scrape dictionary first!");
            
            const startBtn = document.querySelector('#start-button-main');
            if (startBtn) startBtn.click();

            solverActive = true;
            elements.startSolverBtn.innerText = "STOP SOLVER";
            elements.startSolverBtn.style.background = "#444";
            
            const intervalTime = parseInt(elements.delayInput.value) + parseInt(elements.offsetInput.value);
            mainLoop = setInterval(runSolverStep, Math.max(intervalTime, 50));
        }
    };
})();