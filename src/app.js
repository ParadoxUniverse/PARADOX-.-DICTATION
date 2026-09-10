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
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
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
let finalTranscript = '';

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
  instance.lang = 'en-US';
  instance.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalTranscript += `${transcript} `;
      else interim += transcript;
    }
    editor.textContent = finalTranscript + interim;
    updateWordCount();
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
function startRecording() {
  if (!recognition) recognition = buildRecognition();
  if (recognition) {
    try { recognition.start(); } catch (e) { /* browser may already be listening */ }
  } else {
    showToast('Live dictation is not supported here — demo mode is on.', 'info');
  }
  setRecordingUI(true);
}
function stopRecording() {
  if (recognition) { try { recognition.stop(); } catch (e) { /* no-op */ } }
  setRecordingUI(false);
}
function toggleRecording() { isRecording ? stopRecording() : startRecording(); }

recordButton.addEventListener('click', toggleRecording);
$('#start-top').addEventListener('click', () => { document.querySelector('.dictation-card').scrollIntoView({ behavior: 'smooth', block: 'center' }); if (!isRecording) startRecording(); });
editor.addEventListener('input', () => { finalTranscript = editor.innerText; updateWordCount(); });
$('#clear-button').addEventListener('click', () => {
  if (!getText()) { showToast('There is nothing to clear.'); return; }
  editor.textContent = ''; finalTranscript = ''; updateWordCount(); showToast('Transcript cleared.');
});
$('#save-button').addEventListener('click', () => {
  if (!getText()) { showToast('Add a few words before saving.', 'error'); editor.focus(); return; }
  const list = $('#session-list');
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const item = document.createElement('article');
  item.className = 'session-item selected newly-saved';
  item.dataset.title = 'Untitled session';
  item.innerHTML = `<div class="session-symbol mint-bg">${icon('mic')}</div><div class="session-info"><strong>Untitled session</strong><span>Just now <b>·</b> ${formatTime(elapsed)}</span></div><button class="session-more" aria-label="Session options">•••</button>`;
  $$('.session-item', list).forEach(el => el.classList.remove('selected'));
  list.prepend(item);
  $('#panel-title-text').textContent = 'Untitled session';
  showToast(`Session saved at ${time}.`, 'success');
});
$('#new-session').addEventListener('click', () => {
  if (isRecording) stopRecording();
  editor.textContent = ''; finalTranscript = ''; elapsed = 0; recordTime.textContent = '00:00'; updateWordCount();
  $('#panel-title-text').textContent = 'Quick dictation';
  $$('.session-item').forEach(el => el.classList.remove('selected'));
  document.querySelector('.dictation-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => editor.focus(), 450);
});
$('#pin-button').addEventListener('click', (event) => {
  event.currentTarget.classList.toggle('pinned');
  showToast(event.currentTarget.classList.contains('pinned') ? 'Added to starred.' : 'Removed from starred.');
});

$$('.session-item').forEach((item) => item.addEventListener('click', (event) => {
  if (event.target.closest('.session-more')) { showToast('Session options coming soon.'); return; }
  $$('.session-item').forEach(el => el.classList.remove('selected'));
  item.classList.add('selected');
  $('#panel-title-text').textContent = item.dataset.title;
  showToast(`Opened “${item.dataset.title}”.`);
}));

$('#import-button').addEventListener('click', () => $('#audio-input').click());
$('#audio-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) showToast(`${file.name} is ready to transcribe.`, 'success');
});
$$('.nav-item').forEach((item) => item.addEventListener('click', () => {
  $$('.nav-item').forEach(el => el.classList.remove('active')); item.classList.add('active');
}));
$('#view-all').addEventListener('click', () => showToast('You are viewing your most recent sessions.'));
$('.tip-close').addEventListener('click', (event) => { event.currentTarget.closest('.tip-card').classList.add('dismissed'); });

const sidebar = $('#sidebar');
const overlay = $('#sidebar-overlay');
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('visible'); }
$('#open-sidebar').addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('visible'); });
$('#close-sidebar').addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

$('#theme-button').addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  showToast(document.body.classList.contains('light-theme') ? 'Light mode on.' : 'Dark mode on.');
});
document.addEventListener('keydown', (event) => {
  const command = event.metaKey || event.ctrlKey;
  if (command && event.key.toLowerCase() === 'n') { event.preventDefault(); $('#new-session').click(); }
  if (command && event.key === 'Enter') { event.preventDefault(); $('#save-button').click(); }
  if (event.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
});
updateWordCount();
