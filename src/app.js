import './styles.css';

const iconPaths = {
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  star: '<path d="m12 3 2.75 5.57 6.15.9-4.45 4.34 1.05 6.13L12 17.05l-5.5 2.89 1.05-6.13L3.1 9.47l6.15-.9L12 3Z"/>',
  trash: '<path d="M4.5 7.5h15M9 7.5V5h6v2.5m-8.5 0 .75 12h9.5l.75-12M10 11v5M14 11v5"/>',
  upload: '<path d="M12 15V4m0 0L8 8m4-4 4 4M5 14v4.5h14V14"/>',
  mic: '<rect x="8.5" y="3" width="7" height="11" rx="3.5"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7"/>',
  file: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M9.5 12h5M9.5 15.5h5"/>',
  spark: '<path d="m12 3 1.35 5.65L19 10l-5.65 1.35L12 17l-1.35-5.65L5 10l5.65-1.35L12 3ZM18.5 16l.55 2.05L21 18.5l-1.95.55L18.5 21l-.55-1.95L16 18.5l1.95-.45L18.5 16Z"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
  quote: '<path d="M7.5 15.5H5a1 1 0 0 1-1-1V10a3 3 0 0 1 3-3h1v3H6.5a1 1 0 0 0-1 1v.5h2v4Zm8 0H13a1 1 0 0 1-1-1V10a3 3 0 0 1 3-3h1v3h-1.5a1 1 0 0 0-1 1v.5h2v4Z"/>',
  list: '<path d="M8 6h11M8 12h11M8 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  pen: '<path d="m15.5 5.5 3 3L8 19l-4 1 1-4 10.5-10.5Z"/><path d="m13 8 3 3"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  search: '<circle cx="10.8" cy="10.8" r="5.8"/><path d="m15.2 15.2 4 4"/>',
  settings: '<path d="M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"/><path d="m19.2 13.7 1.3 1-.9 1.6-1.6-.5a7.8 7.8 0 0 1-1.5 1.2l-.1 1.7h-1.9l-.5-1.6a7.6 7.6 0 0 1-1.9.2l-1 1.3-1.7-.8.4-1.7a7.5 7.5 0 0 1-1.4-1.4l-1.7.4-.8-1.7 1.3-1a7.8 7.8 0 0 1-.1-1.9l-1.4-1 .8-1.7 1.7.4a7.5 7.5 0 0 1 1.4-1.4l-.4-1.7 1.7-.8 1 1.3a7.6 7.6 0 0 1 1.9-.2l.5-1.6h1.9l.1 1.7a7.8 7.8 0 0 1 1.5 1.2l1.6-.5.9 1.6-1.3 1a7.8 7.8 0 0 1 .1 1.9Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  sun: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M4.8 4.8l1.4 1.4M17.8 17.8l1.4 1.4M2.5 12h2M19.5 12h2M4.8 19.2l1.4-1.4M17.8 6.2l1.4-1.4"/>',
  bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>'
};
function icon(name) { return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || ''}</svg>`; }

document.body.innerHTML = document.body.innerHTML.replace(/\$\{icon\('([^']+)'\)\}/g, (_, name) => icon(name));

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const editor = $('#transcript-editor');
const recordButton = $('#record-button');
const recordStatus = $('#record-status');
const recordHint = $('#record-hint');
const recordTime = $('#record-time');
const dictationCard = $('#dictation-card');
const wordCount = $('#word-count');
const waveform = $('#waveform');
const toast = $('#toast');
let isRecording = false;
let elapsed = 0;
let timer;
let toastTimer;
let recognition;
let mediaRecorder;
let recordedChunks = [];
let lastRecordingBlob;
let finalTranscript = '';
let deferredInstallPrompt;
const STORAGE_KEY = 'paradox-dictation-sessions';
const DRAFT_KEY = 'paradox-dictation-draft';
const AUTOSAVE_KEY = 'paradox-dictation-autosave';
const LANGUAGE_KEY = 'paradox-dictation-language';
const getPreference = (key, fallback) => {
  try { return localStorage.getItem(key) ?? fallback; }
  catch (error) { return fallback; }
};

function showToast(message, type = '') {
  toast.textContent = message;
  toast.className = `toast visible ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3200);
}

function getText() {
  return editor.innerText.replace(/\u200B/g, '').trim();
}
function updateWordCount() {
  const words = getText() ? getText().split(/\s+/).filter(Boolean).length : 0;
  wordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
}
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}
function updateTimer() { elapsed += 1; recordTime.textContent = formatTime(elapsed); }
function readSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch (error) { return []; }
}
function writeSessions(sessions) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 25))); }
  catch (error) { showToast('Your browser could not save this session.', 'error'); }
}
function persistDraft() {
  try {
    if (getPreference(AUTOSAVE_KEY, 'true') !== 'true') return;
    if (getText()) localStorage.setItem(DRAFT_KEY, JSON.stringify({ text: getText(), elapsed }));
    else localStorage.removeItem(DRAFT_KEY);
  } catch (error) { /* private browsing may disable storage */ }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>\"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[character]));
}
function titleFromTranscript(text) {
  const firstSentence = text.split(/[.!?\n]/)[0].trim();
  if (!firstSentence) return 'Untitled session';
  return firstSentence.length > 31 ? `${firstSentence.slice(0, 31).trim()}…` : firstSentence;
}
function sessionElement(session) {
  const item = document.createElement('article');
  item.className = 'session-item';
  item.dataset.title = session.title;
  item.dataset.userSession = session.id;
  item._sessionText = session.text;
  item.innerHTML = `<div class="session-symbol mint-bg">${icon('mic')}</div><div class="session-info"><strong>${escapeHtml(session.title)}</strong><span>${session.time || 'Saved locally'} <b>·</b> ${formatTime(session.duration || 0)}</span></div><button class="session-more" aria-label="Session options">•••</button>`;
  return item;
}
function selectSession(item) {
  $$('.session-item').forEach((el) => el.classList.remove('selected'));
  item.classList.add('selected');
  $('#panel-title-text').textContent = item.dataset.title;
  if (typeof item._sessionText === 'string') {
    editor.textContent = item._sessionText;
    finalTranscript = item._sessionText;
    updateWordCount();
    persistDraft();
    $('#download-transcript-button').hidden = !getText();
  }
  showToast(`Opened “${item.dataset.title}”.`);
}
function attachSessionListeners(root = document) {
  $$('.session-item', root).forEach((item) => {
    if (item.dataset.bound) return;
    item.dataset.bound = 'true';
    item.addEventListener('click', (event) => {
      if (event.target.closest('.session-more')) { showToast('Session options coming soon.'); return; }
      selectSession(item);
    });
  });
}
function filterSessions(query = $('#session-search')?.value || '') {
  const normalized = query.trim().toLowerCase();
  const items = $$('.session-item');
  let visible = 0;
  items.forEach((item) => {
    const matches = !normalized || item.dataset.title.toLowerCase().includes(normalized);
    item.hidden = !matches;
    if (matches) visible += 1;
  });
  const summary = $('#session-summary');
  if (summary) summary.textContent = normalized ? `${visible} match${visible === 1 ? '' : 'es'}` : `${items.length} saved`;
}
function restoreWorkspace() {
  const list = $('#session-list');
  readSessions().reverse().forEach((session) => list.prepend(sessionElement(session)));
  attachSessionListeners();
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (draft?.text) { editor.textContent = draft.text; finalTranscript = draft.text; elapsed = draft.elapsed || 0; recordTime.textContent = formatTime(elapsed); }
  } catch (error) { /* start with an empty editor */ }
}
function setRecordingUI(active) {
  isRecording = active;
  dictationCard.classList.toggle('is-recording', active);
  recordButton.classList.toggle('is-recording', active);
  waveform.classList.toggle('is-active', active);
  if (active) {
    recordStatus.textContent = 'Listening…';
    recordHint.textContent = 'Click to pause · we’re listening';
    recordButton.setAttribute('aria-label', 'Stop recording');
    timer = setInterval(updateTimer, 1000);
  } else {
    clearInterval(timer);
    recordStatus.textContent = elapsed > 0 ? 'Paused · ready to continue' : 'Ready when you are';
    recordHint.textContent = elapsed > 0 ? 'Click to continue speaking' : 'Click to start speaking';
    recordButton.setAttribute('aria-label', 'Start recording');
  }
}

function buildRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return null;
  const instance = new Recognition();
  instance.continuous = true;
  instance.interimResults = true;
  instance.lang = getPreference(LANGUAGE_KEY, 'en-US');
  instance.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalTranscript += `${transcript} `;
      else interim += transcript;
    }
    editor.textContent = finalTranscript + interim;
    updateWordCount();
    persistDraft();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
  };
  instance.onerror = (event) => {
    if (event.error === 'not-allowed') showToast('Microphone access was blocked. You can still type your transcript.', 'error');
    if (isRecording) setRecordingUI(false);
  };
  instance.onend = () => { if (isRecording) { try { instance.start(); } catch (e) { /* already starting */ } } };
  return instance;
}
async function startRecording() {
  if (!recognition) recognition = buildRecognition();
  let capturedAudio = false;
  if (navigator.mediaDevices?.getUserMedia && window.MediaRecorder) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) recordedChunks.push(event.data); };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (recordedChunks.length) {
          lastRecordingBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
          $('#download-audio-button').hidden = false;
        }
      };
      mediaRecorder.start();
      capturedAudio = true;
    } catch (error) {
      showToast('Microphone access was blocked. You can still type your transcript.', 'error');
    }
  }
  if (recognition) {
    try { recognition.start(); } catch (e) { /* browser may already be listening */ }
  } else if (!capturedAudio) {
    showToast('Live dictation is not supported here — demo mode is on.', 'info');
  }
  setRecordingUI(true);
}
function stopRecording() {
  if (recognition) { try { recognition.stop(); } catch (e) { /* no-op */ } }
  if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
  setRecordingUI(false);
}
function toggleRecording() { isRecording ? stopRecording() : startRecording(); }

recordButton.addEventListener('click', toggleRecording);
const topStartButton = $('#start-top');
if (topStartButton) topStartButton.addEventListener('click', () => { document.querySelector('.dictation-card').scrollIntoView({ behavior: 'smooth', block: 'center' }); if (!isRecording) startRecording(); });
if (window.paradoxDesktop?.onWidgetCommand) {
  window.paradoxDesktop.onWidgetCommand((command) => {
    if (command !== 'start-recording') return;
    document.querySelector('.dictation-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (!isRecording) startRecording();
  });
}
editor.addEventListener('input', () => { finalTranscript = editor.innerText; updateWordCount(); persistDraft(); $('#download-transcript-button').hidden = !getText(); });
$('#clear-button').addEventListener('click', () => {
  if (!getText()) { showToast('There is nothing to clear.'); return; }
  editor.textContent = ''; finalTranscript = ''; updateWordCount(); persistDraft(); $('#download-transcript-button').hidden = true; showToast('Transcript cleared.');
});
$('#download-transcript-button').addEventListener('click', async () => {
  const text = getText();
  if (!text) { showToast('Add a few words before exporting.', 'error'); return; }
  const safeTitle = titleFromTranscript(text).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'paradox-session';
  const filename = `${safeTitle}.txt`;
  if (window.paradoxDesktop?.saveText) {
    const destination = await window.paradoxDesktop.saveText(text, filename);
    showToast(`Transcript saved to ${destination}.`, 'success');
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Transcript download started.', 'success');
});
$('#download-audio-button').addEventListener('click', async () => {
  if (!lastRecordingBlob) { showToast('Record something first.', 'error'); return; }
  const filename = `paradox-recording-${new Date().toISOString().slice(0, 10)}.webm`;
  if (window.paradoxDesktop?.saveAudio) {
    const bytes = new Uint8Array(await lastRecordingBlob.arrayBuffer());
    const destination = await window.paradoxDesktop.saveAudio(bytes, filename);
    showToast(`Audio saved to ${destination}.`, 'success');
    return;
  }
  const url = URL.createObjectURL(lastRecordingBlob);
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Audio download started.', 'success');
});
$('#save-button').addEventListener('click', () => {
  const text = getText();
  if (!text) { showToast('Add a few words before saving.', 'error'); editor.focus(); return; }
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const session = {
    id: window.crypto?.randomUUID?.() || `session-${Date.now()}`,
    title: titleFromTranscript(text),
    text,
    duration: elapsed,
    time: `Today, ${time}`
  };
  const list = $('#session-list');
  const item = sessionElement(session);
  item.classList.add('selected', 'newly-saved');
  $$('.session-item', list).forEach((el) => el.classList.remove('selected'));
  list.prepend(item);
  attachSessionListeners(list);
  writeSessions([session, ...readSessions().filter((saved) => saved.id !== session.id)]);
  $('#panel-title-text').textContent = session.title;
  persistDraft();
  showToast(`“${session.title}” saved locally.`, 'success');
});
$('#new-session').addEventListener('click', () => {
  if (isRecording) stopRecording();
  editor.textContent = ''; finalTranscript = ''; elapsed = 0; recordTime.textContent = '00:00'; updateWordCount(); persistDraft(); $('#download-transcript-button').hidden = true;
  $('#panel-title-text').textContent = 'Quick dictation';
  $$('.session-item').forEach(el => el.classList.remove('selected'));
  document.querySelector('.dictation-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => editor.focus(), 450);
});
$('#pin-button').addEventListener('click', (event) => {
  event.currentTarget.classList.toggle('pinned');
  showToast(event.currentTarget.classList.contains('pinned') ? 'Added to starred.' : 'Removed from starred.');
});

$('#import-button').addEventListener('click', () => $('#audio-input').click());
$('#audio-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) showToast(`${file.name} is ready to transcribe.`, 'success');
});
$$('.nav-item').forEach((item) => item.addEventListener('click', () => {
  $$('.nav-item').forEach(el => el.classList.remove('active')); item.classList.add('active');
}));
$('#session-search').addEventListener('input', (event) => filterSessions(event.target.value));
$('#view-all').addEventListener('click', () => { $('#session-search').value = ''; filterSessions(); showToast('Showing all saved sessions.'); });

const settingsModal = $('#settings-modal');
const languagePreference = $('#language-preference');
const autosaveToggle = $('#autosave-toggle');
const closeWidgetToggle = $('#close-widget-toggle');
function openSettings() {
  languagePreference.value = getPreference(LANGUAGE_KEY, 'en-US');
  autosaveToggle.checked = getPreference(AUTOSAVE_KEY, 'true') === 'true';
  closeWidgetToggle.checked = getPreference('paradox-widget-on-close', 'true') === 'true';
  settingsModal.classList.add('open');
  settingsModal.setAttribute('aria-hidden', 'false');
}
function closeSettings() {
  settingsModal.classList.remove('open');
  settingsModal.setAttribute('aria-hidden', 'true');
}
$('#settings-button').addEventListener('click', openSettings);
$('#account-button').addEventListener('click', openSettings);
$('#close-settings').addEventListener('click', closeSettings);
$('#done-settings').addEventListener('click', closeSettings);
settingsModal.addEventListener('click', (event) => { if (event.target === settingsModal) closeSettings(); });
languagePreference.addEventListener('change', (event) => {
  localStorage.setItem(LANGUAGE_KEY, event.target.value);
  if (recognition) { try { recognition.lang = event.target.value; } catch (error) { /* restart recording to apply */ } }
  showToast(`Dictation language set to ${event.target.options[event.target.selectedIndex].text}.`, 'success');
});
autosaveToggle.addEventListener('change', (event) => {
  localStorage.setItem(AUTOSAVE_KEY, String(event.target.checked));
  if (!event.target.checked) localStorage.removeItem(DRAFT_KEY);
  else persistDraft();
});
closeWidgetToggle.addEventListener('change', (event) => {
  localStorage.setItem('paradox-widget-on-close', String(event.target.checked));
  window.paradoxDesktop?.setWidgetOnClose?.(event.target.checked);
});
const tipClose = $('.tip-close');
if (tipClose) tipClose.addEventListener('click', (event) => { event.currentTarget.closest('.tip-card').classList.add('dismissed'); });

const sidebar = $('#sidebar');
const overlay = $('#sidebar-overlay');
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('visible'); }
$('#open-sidebar').addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('visible'); });
$('#close-sidebar').addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

$('#theme-button').addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  showToast(document.body.classList.contains('dark-theme') ? 'Dark mode on.' : 'Light mode on.');
});
document.addEventListener('keydown', (event) => {
  const command = event.metaKey || event.ctrlKey;
  if (command && event.key.toLowerCase() === 'n') { event.preventDefault(); $('#new-session').click(); }
  if (command && event.key === 'Enter') { event.preventDefault(); $('#save-button').click(); }
  if (event.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
});

const installButton = $('#install-button');
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!deferredInstallPrompt) { showToast('Use your browser menu to install Paradox as an app.'); return; }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});
window.addEventListener('appinstalled', () => { installButton.hidden = true; showToast('Paradox was installed on your computer.', 'success'); });
if (navigator.serviceWorker) navigator.serviceWorker.register('./sw.js').catch(() => { /* offline mode is optional in Electron */ });
window.paradoxDesktop?.setWidgetOnClose?.(getPreference('paradox-widget-on-close', 'true') === 'true');
restoreWorkspace();
filterSessions();
updateWordCount();
$('#download-transcript-button').hidden = !getText();
