import { parseDocument, DocumentParseError } from './parsers/document-parser.js';
import {
  contextAround,
  countCharacters,
  countWords,
  extractSelectionText,
  findWords,
  isMeaningfulText,
  nodeToPracticeText,
  normalizeWordKey,
} from './core/text.js';
import { formatElapsed } from './core/statistics.js';
import { keyboardInputFromEvent, TypingSession } from './core/typing-session.js';
import { buildMistakePractice, MistakeStore } from './storage/mistake-store.js';
import { KeyboardAudio } from './audio/keyboard-audio.js';

const $ = (selector) => document.querySelector(selector);
const elements = {
  stages: { import: $('#importStage'), read: $('#readStage'), type: $('#typeStage') },
  stageMarkers: [...document.querySelectorAll('[data-stage-marker]')],
  homeButton: $('#homeButton'),
  fileInput: $('#fileInput'),
  dropZone: $('#dropZone'),
  parseStatus: $('#parseStatus'),
  parseSpinner: $('#parseSpinner'),
  parseStatusTitle: $('#parseStatusTitle'),
  parseStatusMessage: $('#parseStatusMessage'),
  replaceDocumentButton: $('#replaceDocumentButton'),
  fileType: $('#fileType'),
  fileName: $('#fileName'),
  fileStats: $('#fileStats'),
  documentPreview: $('#documentPreview'),
  selectionBar: $('#selectionBar'),
  selectionSummary: $('#selectionSummary'),
  lengthAdvisory: $('#lengthAdvisory'),
  practiceAllButton: $('#practiceAllButton'),
  practiceSelectionButton: $('#practiceSelectionButton'),
  sessionKicker: $('#sessionKicker'),
  typeTitle: $('#typeTitle'),
  backToDocumentButton: $('#backToDocumentButton'),
  progressValue: $('#progressValue'),
  timeValue: $('#timeValue'),
  wpmValue: $('#wpmValue'),
  accuracyValue: $('#accuracyValue'),
  progressBar: $('#progressBar'),
  typingPassage: $('#typingPassage'),
  sessionOverlay: $('#sessionOverlay'),
  overlayEyebrow: $('#overlayEyebrow'),
  overlayTitle: $('#overlayTitle'),
  overlayMessage: $('#overlayMessage'),
  overlayActionButton: $('#overlayActionButton'),
  startPauseButton: $('#startPauseButton'),
  restartButton: $('#restartButton'),
  endSessionButton: $('#endSessionButton'),
  resultsPanel: $('#resultsPanel'),
  resultsKicker: $('#resultsKicker'),
  resultsTitle: $('#resultsTitle'),
  resultsLead: $('#resultsLead'),
  resultWpm: $('#resultWpm'),
  resultAccuracy: $('#resultAccuracy'),
  resultTime: $('#resultTime'),
  resultErrors: $('#resultErrors'),
  missedWords: $('#missedWords'),
  tryAgainButton: $('#tryAgainButton'),
  resultLibraryButton: $('#resultLibraryButton'),
  openLibraryButton: $('#openLibraryButton'),
  mistakeBadge: $('#mistakeBadge'),
  libraryDialog: $('#libraryDialog'),
  closeLibraryButton: $('#closeLibraryButton'),
  libraryEmpty: $('#libraryEmpty'),
  mistakeList: $('#mistakeList'),
  libraryCount: $('#libraryCount'),
  selectAllMistakes: $('#selectAllMistakes'),
  practiceMistakesButton: $('#practiceMistakesButton'),
  exportMistakesButton: $('#exportMistakesButton'),
  importMistakesInput: $('#importMistakesInput'),
  clearHistoryButton: $('#clearHistoryButton'),
  soundToggle: $('#soundToggle'),
  volumeRange: $('#volumeRange'),
  confirmDialog: $('#confirmDialog'),
  confirmTitle: $('#confirmTitle'),
  confirmMessage: $('#confirmMessage'),
  confirmCancel: $('#confirmCancel'),
  confirmAccept: $('#confirmAccept'),
  toast: $('#toast'),
  announcements: $('#sessionAnnouncements'),
};

const mistakeStore = new MistakeStore();
const keyboardAudio = new KeyboardAudio();
// Live query: `matches` is read at each use so an OS motion change mid-session is respected.
const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const stageOrder = ['import', 'read', 'type'];

const app = {
  stage: 'import',
  document: null,
  documentText: '',
  selectedText: '',
  session: null,
  sessionId: null,
  sessionKind: 'document',
  practiceWords: [],
  practiceMarked: false,
  wordRanges: [],
  characterSpans: [],
  sessionMistakes: new Map(),
  timerId: null,
  toastId: null,
  parseRequest: 0,
};

const stageFocusTarget = {
  import: () => elements.dropZone,
  read: () => elements.documentPreview,
  type: () => (elements.sessionOverlay.classList.contains('is-hidden') ? elements.typingPassage : elements.overlayActionButton),
};

// A stage swap moves focus into the new panel's primary control, but never yanks focus
// away from an element that is already inside the stage being shown.
function focusActiveStage(stage) {
  const panel = elements.stages[stage];
  if (panel.contains(document.activeElement)) return;
  stageFocusTarget[stage]?.()?.focus({ preventScroll: true });
}

function showStage(stage) {
  app.stage = stage;
  Object.entries(elements.stages).forEach(([name, panel]) => {
    panel.hidden = name !== stage;
    panel.classList.toggle('is-active', name === stage);
  });
  const activeIndex = stageOrder.indexOf(stage);
  elements.stageMarkers.forEach((marker) => {
    const index = stageOrder.indexOf(marker.dataset.stageMarker);
    marker.classList.toggle('is-current', index === activeIndex);
    marker.classList.toggle('is-done', index < activeIndex);
    if (index === activeIndex) marker.setAttribute('aria-current', 'step');
    else marker.removeAttribute('aria-current');
  });
  focusActiveStage(stage);
}

function announce(message) {
  elements.announcements.textContent = '';
  requestAnimationFrame(() => { elements.announcements.textContent = message; });
}

function showToast(message, duration = 3800) {
  clearTimeout(app.toastId);
  elements.toast.classList.remove('is-leaving');
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  app.toastId = setTimeout(() => {
    elements.toast.classList.add('is-leaving');
    app.toastId = setTimeout(() => {
      elements.toast.hidden = true;
      elements.toast.classList.remove('is-leaving');
    }, 170);
  }, duration);
}

function setParseStatus(type, title, message) {
  elements.parseStatus.hidden = false;
  elements.parseStatus.classList.toggle('is-error', type === 'error');
  elements.parseStatus.classList.toggle('is-success', type === 'success');
  elements.parseStatusTitle.textContent = title;
  elements.parseStatusMessage.textContent = message;
}

function clearParseStatus() {
  elements.parseStatus.hidden = true;
  elements.parseStatus.classList.remove('is-error', 'is-success');
}

function resetSession() {
  elements.stages.type.classList.remove('is-ended');
  clearInterval(app.timerId);
  app.timerId = null;
  app.session = null;
  app.sessionId = null;
  app.characterSpans = [];
  app.sessionMistakes.clear();
  app.practiceWords = [];
  app.practiceMarked = false;
  app.wordRanges = [];
  elements.typingPassage.replaceChildren();
  elements.resultsPanel.hidden = true;
}

function resetDocument() {
  app.parseRequest += 1;
  resetSession();
  app.document = null;
  app.documentText = '';
  app.selectedText = '';
  elements.documentPreview.replaceChildren();
  elements.fileInput.value = '';
  updateSelectionUI('');
  clearParseStatus();
  elements.dropZone.removeAttribute('aria-busy');
}

async function confirmAction({ title, message, action = 'Continue', tone = 'danger' }) {
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  elements.confirmAccept.textContent = action;
  elements.confirmAccept.classList.toggle('button-danger', tone === 'danger');
  elements.confirmAccept.classList.toggle('button-primary', tone !== 'danger');
  elements.confirmDialog.showModal();
  return new Promise((resolve) => {
    const finish = (answer) => {
      elements.confirmAccept.removeEventListener('click', accept);
      elements.confirmCancel.removeEventListener('click', cancel);
      elements.confirmDialog.removeEventListener('cancel', cancelEvent);
      if (elements.confirmDialog.open) elements.confirmDialog.close();
      resolve(answer);
    };
    const accept = () => finish(true);
    const cancel = () => finish(false);
    const cancelEvent = (event) => { event.preventDefault(); finish(false); };
    elements.confirmAccept.addEventListener('click', accept);
    elements.confirmCancel.addEventListener('click', cancel);
    elements.confirmDialog.addEventListener('cancel', cancelEvent);
  });
}

function hasSessionProgress() {
  return Boolean(app.session && (app.session.cursor > 0 || app.session.status === 'running' || app.session.status === 'paused'));
}

async function requestNewDocument() {
  if (app.document || hasSessionProgress()) {
    const approved = await confirmAction({
      title: 'Choose another document?',
      message: 'The current preview and typing session will be cleared. Saved mistake words will stay in your library.',
      action: 'Clear document',
      tone: 'primary',
    });
    if (!approved) return;
  }
  resetDocument();
  showStage('import');
  elements.fileInput.click();
}

async function handleFile(file) {
  if (!file) return;
  elements.fileInput.value = '';
  resetDocument();
  const parseRequest = ++app.parseRequest;
  showStage('import');
  elements.dropZone.setAttribute('aria-busy', 'true');
  setParseStatus('', 'Reading your document', 'Parsing locally in this browser. Nothing is being uploaded.');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  try {
    const result = await parseDocument(file);
    if (parseRequest !== app.parseRequest) return;
    // Parser output is sanitized before this insertion.
    elements.documentPreview.innerHTML = result.html;
    const practiceText = nodeToPracticeText(elements.documentPreview);
    if (!isMeaningfulText(practiceText) || countWords(practiceText) === 0) {
      throw new DocumentParseError('no-text', 'No usable text was found. Try a document with selectable words rather than images only.');
    }
    app.document = result;
    app.documentText = practiceText;
    elements.fileType.textContent = result.extension.toUpperCase();
    elements.fileName.textContent = result.name;
    elements.fileStats.textContent = `${countWords(practiceText).toLocaleString()} words · ${countCharacters(practiceText).toLocaleString()} characters`;
    setParseStatus('success', 'Document ready', 'Your readable preview is ready for selection.');
    elements.dropZone.removeAttribute('aria-busy');
    setTimeout(() => {
      if (parseRequest === app.parseRequest) showStage('read');
    }, 260);
    if (result.warnings.length) showToast(`Imported with ${result.warnings.length} formatting warning${result.warnings.length === 1 ? '' : 's'}. The readable text is available.`);
  } catch (error) {
    if (parseRequest !== app.parseRequest) return;
    app.document = null;
    app.documentText = '';
    elements.documentPreview.replaceChildren();
    const message = error instanceof DocumentParseError
      ? error.message
      : 'Something went wrong while reading this document. Check the file and try again.';
    setParseStatus('error', 'Could not import this document', message);
    elements.dropZone.removeAttribute('aria-busy');
    elements.fileInput.value = '';
  }
}

function updateSelectionUI(text) {
  const words = countWords(text);
  const characters = countCharacters(text);
  const valid = isMeaningfulText(text) && words > 0;
  app.selectedText = valid ? text : '';
  elements.practiceSelectionButton.disabled = !valid;
  elements.selectionBar.classList.toggle('has-selection', valid);
  elements.practiceSelectionButton.setAttribute('aria-disabled', String(!valid));
  elements.selectionSummary.querySelector('strong').textContent = valid
    ? `${words.toLocaleString()} word${words === 1 ? '' : 's'} selected`
    : 'No text selected';
  elements.selectionSummary.querySelector('span:not(.selection-dot)').textContent = valid
    ? `${characters.toLocaleString()} characters ready to practice`
    : 'Drag across any text in the preview';
  elements.lengthAdvisory.hidden = characters < 30000;
  if (characters >= 30000) {
    elements.lengthAdvisory.textContent = `This selection contains ${characters.toLocaleString()} characters. It may take longer to render and complete, but Margin will not truncate it.`;
  }
}

function refreshSelection() {
  if (app.stage !== 'read') return;
  const selection = window.getSelection();
  const text = extractSelectionText(selection, elements.documentPreview);
  if (text || !document.activeElement?.closest?.('.selection-bar')) updateSelectionUI(text);
}

function makeSessionId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function renderTypingCharacters() {
  const fragment = document.createDocumentFragment();
  app.characterSpans = app.session.characters.map((character, index) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = character;
    span.dataset.index = String(index);
    if (/\s/u.test(character)) span.dataset.whitespace = 'true';
    if (character === '\n') span.classList.add('is-newline');
    fragment.append(span);
    return span;
  });
  elements.typingPassage.replaceChildren(fragment);
  updateCharacterState(0);
}

function updateCharacterState(index) {
  const span = app.characterSpans[index];
  if (!span || !app.session) return;
  const evaluation = app.session.evaluations[index];
  span.classList.toggle('is-correct', evaluation === 'correct');
  span.classList.toggle('is-incorrect', evaluation === 'incorrect');
  span.classList.toggle('is-current', index === app.session.cursor && app.session.status !== 'completed');
}

function keepCurrentVisible() {
  const current = app.characterSpans[app.session?.cursor];
  if (!current) return;
  const container = elements.typingPassage;
  const targetTop = current.offsetTop - container.clientHeight * 0.42;
  if (Math.abs(container.scrollTop - targetTop) > container.clientHeight * 0.25) {
    container.scrollTo({ top: Math.max(0, targetTop), behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
  }
}

function updateLiveStatistics() {
  if (!app.session) return;
  const stats = app.session.statistics();
  const progress = app.session.status === 'completed' ? 100 : Math.min(99.9, stats.progress);
  elements.progressValue.textContent = `${Math.floor(progress)}%`;
  elements.timeValue.textContent = formatElapsed(stats.elapsedMs);
  elements.wpmValue.textContent = String(Math.round(stats.wpm));
  elements.accuracyValue.textContent = `${Math.round(stats.accuracy)}%`;
  elements.progressBar.style.width = `${progress}%`;
  elements.progressBar.parentElement.setAttribute('aria-valuenow', String(Math.floor(progress)));
}

function setOverlay(mode) {
  const content = {
    idle: ['Ready when you are', 'Start with one deliberate keystroke.', 'The timer begins only after you type the first character.', 'Start session'],
    paused: ['Session paused', 'Your place is saved.', 'Resume when you are ready. Paused time is not counted.', 'Resume session'],
  }[mode];
  if (!content) {
    elements.sessionOverlay.classList.add('is-hidden');
    return;
  }
  elements.overlayEyebrow.textContent = content[0];
  elements.overlayTitle.textContent = content[1];
  elements.overlayMessage.textContent = content[2];
  elements.overlayActionButton.textContent = content[3];
  elements.sessionOverlay.classList.remove('is-hidden');
}

function beginTypingSession(text, { kind = 'document', practiceWords = [] } = {}) {
  elements.stages.type.classList.remove('is-ended');
  if (!isMeaningfulText(text) || countWords(text) === 0) {
    showToast('Choose a passage that contains at least one readable word.');
    return;
  }
  resetSession();
  app.session = new TypingSession(text);
  app.sessionId = makeSessionId();
  app.sessionKind = kind;
  app.practiceWords = practiceWords;
  app.wordRanges = findWords(text);
  app.sessionMistakes = new Map();
  elements.sessionKicker.textContent = kind === 'mistakes' ? 'Mistake practice' : 'Typing session';
  elements.typeTitle.textContent = kind === 'mistakes' ? 'Make the hard words familiar' : 'Find your rhythm';
  elements.backToDocumentButton.textContent = app.document ? 'Back to document' : 'Back to import';
  elements.resultsPanel.hidden = true;
  elements.startPauseButton.hidden = false;
  elements.restartButton.hidden = false;
  elements.endSessionButton.hidden = false;
  elements.startPauseButton.textContent = 'Start';
  renderTypingCharacters();
  updateLiveStatistics();
  setOverlay('idle');
  showStage('type');
  elements.overlayActionButton.focus();
}

async function requestTypingSession(text, options = {}) {
  const characters = countCharacters(text);
  if (characters >= 30000) {
    const approved = await confirmAction({
      title: 'Start a long practice session?',
      message: `This passage contains ${characters.toLocaleString()} characters. Rendering and scrolling may be slower on some devices, but nothing will be truncated.`,
      action: 'Start full passage',
      tone: 'primary',
    });
    if (!approved) return;
  }
  beginTypingSession(text, options);
}

async function startOrResumeSession() {
  if (!app.session) return;
  await keyboardAudio.unlock();
  if (app.session.status === 'idle') {
    app.session.start();
    if (app.sessionKind === 'mistakes' && !app.practiceMarked) {
      mistakeStore.markPracticed(app.practiceWords, app.sessionId);
      app.practiceMarked = true;
      updateMistakeBadge();
    }
  } else if (app.session.status === 'paused') {
    app.session.resume();
  } else {
    return;
  }
  setOverlay(null);
  elements.startPauseButton.textContent = 'Pause';
  elements.typingPassage.focus({ preventScroll: true });
  clearInterval(app.timerId);
  app.timerId = setInterval(updateLiveStatistics, 250);
  announce(app.session.started ? 'Session resumed.' : 'Session ready. Timing begins with your first typed character.');
}

function pauseSession() {
  if (!app.session?.pause()) return;
  clearInterval(app.timerId);
  updateLiveStatistics();
  elements.startPauseButton.textContent = 'Resume';
  setOverlay('paused');
  elements.overlayActionButton.focus();
  announce('Session paused. Paused time is not counted.');
}

function recordTypingMistake(evaluation) {
  let low = 0;
  let high = app.wordRanges.length - 1;
  let match = null;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = app.wordRanges[middle];
    if (evaluation.index < candidate.start) high = middle - 1;
    else if (evaluation.index >= candidate.end) low = middle + 1;
    else { match = candidate; break; }
  }
  if (!match) return;
  const key = normalizeWordKey(match.word);
  const current = app.sessionMistakes.get(key) || { word: match.word, count: 0 };
  current.count += 1;
  app.sessionMistakes.set(key, current);
  mistakeStore.recordMistake({
    word: match.word,
    context: contextAround(app.session.source, match),
    sessionId: app.sessionId,
  });
  updateMistakeBadge();
}

function handleTypingKeydown(event) {
  if (!app.session || app.session.status !== 'running' || event.isComposing) return;
  if (event.key === 'Backspace') {
    event.preventDefault();
    const oldCursor = app.session.cursor;
    if (app.session.backspace()) {
      updateCharacterState(oldCursor);
      updateCharacterState(app.session.cursor);
      updateLiveStatistics();
      keepCurrentVisible();
    }
    return;
  }
  if (event.key === 'Tab' && (event.shiftKey || app.session.characters[app.session.cursor] !== '\t')) return;
  const input = keyboardInputFromEvent(event);
  if (input === null) return;
  event.preventDefault();
  const evaluation = app.session.evaluate(input);
  if (!evaluation) return;
  keyboardAudio.play();
  if (!evaluation.correct) recordTypingMistake(evaluation);
  updateCharacterState(evaluation.index);
  updateCharacterState(app.session.cursor);
  updateLiveStatistics();
  keepCurrentVisible();
  if (evaluation.completed) finishSession(true);
}

function topMissedWords() {
  return [...app.sessionMistakes.values()].sort((a, b) => b.count - a.count).slice(0, 5);
}

function finishSession(completed) {
  clearInterval(app.timerId);
  app.timerId = null;
  if (!completed) app.session.end();
  updateLiveStatistics();
  const stats = app.session.statistics();
  elements.resultsKicker.textContent = completed ? 'Session complete' : 'Session ended';
  elements.resultsTitle.textContent = completed ? 'A little smoother than before.' : 'A useful stopping point.';
  elements.resultsLead.textContent = completed
    ? 'Every character was evaluated. Here is how the session felt in numbers.'
    : `You handled ${app.session.cursor.toLocaleString()} of ${app.session.characters.length.toLocaleString()} characters.`;
  elements.resultWpm.textContent = String(Math.round(stats.wpm));
  elements.resultAccuracy.textContent = `${Math.round(stats.accuracy)}%`;
  elements.resultTime.textContent = formatElapsed(stats.elapsedMs);
  elements.resultErrors.textContent = app.session.errorCount.toLocaleString();
  const missed = topMissedWords();
  elements.missedWords.replaceChildren();
  if (missed.length) {
    const label = document.createElement('span');
    label.textContent = 'Most missed: ';
    elements.missedWords.append(label);
    missed.forEach(({ word, count }, index) => {
      const item = document.createElement('strong');
      item.textContent = `${word} (${count})${index < missed.length - 1 ? ', ' : ''}`;
      elements.missedWords.append(item);
    });
  } else {
    elements.missedWords.textContent = 'No target words were missed in this session.';
  }
  setOverlay(null);
  elements.stages.type.classList.toggle('is-ended', true);
  elements.resultsPanel.hidden = false;
  elements.startPauseButton.hidden = true;
  elements.endSessionButton.hidden = true;
  elements.restartButton.hidden = true;
  announce(completed ? `Session completed at ${Math.round(stats.wpm)} words per minute with ${Math.round(stats.accuracy)} percent accuracy.` : 'Session ended. Results are available below.');
  elements.resultsPanel.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth', block: 'start' });
}

async function restartSession({ confirm = true } = {}) {
  if (!app.session) return;
  if (confirm && app.session.cursor > 0) {
    const approved = await confirmAction({
      title: 'Restart this passage?',
      message: 'Current timing and keystroke statistics will reset. Mistakes already saved in your library will remain.',
      action: 'Restart',
      tone: 'primary',
    });
    if (!approved) return;
  }
  app.session.restart();
  app.sessionId = makeSessionId();
  app.sessionMistakes.clear();
  app.practiceMarked = false;
  app.characterSpans.forEach((_, index) => updateCharacterState(index));
  elements.typingPassage.scrollTop = 0;
  elements.resultsPanel.hidden = true;
  elements.startPauseButton.hidden = false;
  elements.restartButton.hidden = false;
  elements.endSessionButton.hidden = false;
  elements.startPauseButton.textContent = 'Start';
  updateLiveStatistics();
  setOverlay('idle');
  clearInterval(app.timerId);
  elements.overlayActionButton.focus();
}

async function endSession() {
  if (!app.session || ['ended', 'completed'].includes(app.session.status)) return;
  if (app.session.cursor > 0) {
    const approved = await confirmAction({
      title: 'End this session?',
      message: 'You will see results for the characters handled so far. Saved mistake words will remain in your library.',
      action: 'End session',
    });
    if (!approved) return;
  }
  finishSession(false);
}

async function leaveTyping() {
  if (hasSessionProgress() && !['completed', 'ended'].includes(app.session.status)) {
    const approved = await confirmAction({
      title: 'Leave this session?',
      message: 'The active session will end. Any mistake words already recorded will stay saved.',
      action: 'Leave session',
      tone: 'primary',
    });
    if (!approved) return;
  }
  resetSession();
  showStage(app.document ? 'read' : 'import');
}

function updateMistakeBadge() {
  const count = mistakeStore.list().length;
  elements.mistakeBadge.textContent = count > 99 ? '99+' : String(count);
  elements.mistakeBadge.setAttribute('aria-label', `${count} saved mistake word${count === 1 ? '' : 's'}`);
}

function formatPracticeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

function selectedMistakeKeys() {
  return [...elements.mistakeList.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
}

function updateLibrarySelectionControls() {
  const records = mistakeStore.list();
  const selected = selectedMistakeKeys();
  elements.practiceMistakesButton.disabled = selected.length === 0;
  elements.practiceMistakesButton.textContent = selected.length ? `Practice mistakes (${selected.length})` : 'Practice mistakes';
  elements.selectAllMistakes.checked = records.length > 0 && selected.length === records.length;
  elements.selectAllMistakes.indeterminate = selected.length > 0 && selected.length < records.length;
}

function renderMistakeLibrary() {
  const records = mistakeStore.list();
  elements.mistakeList.replaceChildren();
  elements.libraryEmpty.hidden = records.length > 0;
  elements.mistakeList.hidden = records.length === 0;
  elements.libraryCount.textContent = `${records.length.toLocaleString()} saved word${records.length === 1 ? '' : 's'}`;
  elements.clearHistoryButton.disabled = records.length === 0;
  elements.selectAllMistakes.disabled = records.length === 0;

  const fragment = document.createDocumentFragment();
  records.forEach((record) => {
    const row = document.createElement('div');
    row.className = 'mistake-item';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.value = record.key;
    check.setAttribute('aria-label', `Select ${record.display}`);
    const word = document.createElement('strong');
    word.className = 'mistake-word';
    word.textContent = record.display;
    const context = document.createElement('span');
    context.className = 'mistake-context';
    context.textContent = record.context ? `“${record.context}”` : 'No source context available';
    const count = document.createElement('span');
    count.className = 'mistake-count';
    count.textContent = `${record.mistakeCount} mistake${record.mistakeCount === 1 ? '' : 's'} · ${record.sessionCount} session${record.sessionCount === 1 ? '' : 's'}`;
    const date = document.createElement('time');
    date.className = 'mistake-date';
    date.dateTime = record.lastPracticed;
    date.textContent = formatPracticeDate(record.lastPracticed);
    const remove = document.createElement('button');
    remove.className = 'remove-word';
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.dataset.removeKey = record.key;
    remove.setAttribute('aria-label', `Remove ${record.display} from mistake history`);
    row.append(check, word, context, count, date, remove);
    fragment.append(row);
  });
  elements.mistakeList.append(fragment);
  updateLibrarySelectionControls();
  updateMistakeBadge();
}

function openLibrary() {
  if (app.session?.status === 'running') pauseSession();
  renderMistakeLibrary();
  if (!elements.libraryDialog.open) elements.libraryDialog.showModal();
}

async function removeMistake(key) {
  const record = mistakeStore.list().find((item) => item.key === key);
  if (!record) return;
  const approved = await confirmAction({
    title: `Remove “${record.display}”?`,
    message: 'Its mistake counts and recent context will be permanently removed from this browser.',
    action: 'Remove word',
  });
  if (!approved) return;
  mistakeStore.remove(key);
  renderMistakeLibrary();
}

async function practiceSelectedMistakes() {
  const selected = new Set(selectedMistakeKeys());
  const records = mistakeStore.list().filter(({ key }) => selected.has(key));
  const text = buildMistakePractice(records);
  if (!text) {
    showToast('Select at least one saved word to practice.');
    return;
  }
  if (hasSessionProgress() && !['completed', 'ended'].includes(app.session.status)) {
    const approved = await confirmAction({
      title: 'Start a new mistake session?',
      message: 'The current typing session will end. Its saved mistake words will remain in your library.',
      action: 'Start mistake practice',
      tone: 'primary',
    });
    if (!approved) return;
  }
  elements.libraryDialog.close();
  beginTypingSession(text, { kind: 'mistakes', practiceWords: records.map(({ display }) => display) });
}

function exportMistakes() {
  const blob = new Blob([mistakeStore.exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `margin-mistakes-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function importMistakes(file) {
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('That JSON file is larger than 2 MB. Choose a smaller Margin export.');
    return;
  }
  try {
    mistakeStore.importJSON(await file.text());
    renderMistakeLibrary();
    showToast('Mistake history imported and merged.');
  } catch (error) {
    showToast(error.message || 'That mistake-history file could not be imported.');
  } finally {
    elements.importMistakesInput.value = '';
  }
}

function syncSoundControls() {
  const { enabled, volume } = keyboardAudio.preferences;
  elements.soundToggle.setAttribute('aria-pressed', String(enabled));
  elements.soundToggle.setAttribute('aria-label', enabled ? 'Turn key sound off' : 'Turn key sound on');
  elements.volumeRange.value = String(Math.round(volume * 100));
  elements.volumeRange.disabled = !enabled;
}

function wireEvents() {
  elements.fileInput.addEventListener('change', () => handleFile(elements.fileInput.files[0]));
  elements.dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      elements.fileInput.click();
    }
  });
  ['dragenter', 'dragover'].forEach((type) => elements.dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add('is-dragging');
  }));
  ['dragleave', 'drop'].forEach((type) => elements.dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove('is-dragging');
  }));
  elements.dropZone.addEventListener('drop', (event) => handleFile(event.dataTransfer.files[0]));
  elements.replaceDocumentButton.addEventListener('click', requestNewDocument);
  elements.homeButton.addEventListener('click', async () => {
    if (app.stage === 'import') return;
    if (app.document || hasSessionProgress()) {
      const approved = await confirmAction({
        title: 'Return to import?',
        message: 'The current document and session will be cleared. Saved mistake words will remain.',
        action: 'Return to import',
      tone: 'primary',
      });
      if (!approved) return;
    }
    resetDocument();
    showStage('import');
  });

  document.addEventListener('selectionchange', refreshSelection);
  elements.practiceSelectionButton.addEventListener('click', () => requestTypingSession(app.selectedText));
  elements.practiceAllButton.addEventListener('click', () => requestTypingSession(app.documentText));
  elements.backToDocumentButton.addEventListener('click', leaveTyping);
  elements.overlayActionButton.addEventListener('click', startOrResumeSession);
  elements.startPauseButton.addEventListener('click', () => {
    if (app.session?.status === 'running') pauseSession();
    else startOrResumeSession();
  });
  elements.restartButton.addEventListener('click', restartSession);
  elements.endSessionButton.addEventListener('click', endSession);
  elements.tryAgainButton.addEventListener('click', () => restartSession({ confirm: false }));
  elements.typingPassage.addEventListener('keydown', handleTypingKeydown);
  elements.typingPassage.addEventListener('paste', (event) => {
    if (!app.session || !['running', 'paused'].includes(app.session.status)) return;
    event.preventDefault();
    showToast('Paste is disabled during practice so speed and accuracy stay meaningful.');
    announce('Paste blocked. Type the passage one character at a time.');
  });

  elements.openLibraryButton.addEventListener('click', openLibrary);
  elements.resultLibraryButton.addEventListener('click', openLibrary);
  elements.closeLibraryButton.addEventListener('click', () => elements.libraryDialog.close());
  elements.mistakeList.addEventListener('change', updateLibrarySelectionControls);
  elements.mistakeList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-key]');
    if (button) removeMistake(button.dataset.removeKey);
  });
  elements.selectAllMistakes.addEventListener('change', () => {
    elements.mistakeList.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = elements.selectAllMistakes.checked;
    });
    updateLibrarySelectionControls();
  });
  elements.practiceMistakesButton.addEventListener('click', practiceSelectedMistakes);
  elements.exportMistakesButton.addEventListener('click', exportMistakes);
  elements.importMistakesInput.addEventListener('change', () => importMistakes(elements.importMistakesInput.files[0]));
  elements.clearHistoryButton.addEventListener('click', async () => {
    const approved = await confirmAction({
      title: 'Clear all mistake history?',
      message: 'Every saved word, count, and source context will be permanently removed from this browser.',
      action: 'Clear history',
    });
    if (!approved) return;
    mistakeStore.clear();
    renderMistakeLibrary();
  });

  elements.soundToggle.addEventListener('click', async () => {
    if (app.session?.status === 'running') pauseSession();
    const enabled = !keyboardAudio.preferences.enabled;
    keyboardAudio.setEnabled(enabled);
    if (enabled) await keyboardAudio.unlock();
    syncSoundControls();
    announce(`Key sound ${enabled ? 'on' : 'off'}.`);
  });
  elements.volumeRange.addEventListener('input', () => {
    if (app.session?.status === 'running') pauseSession();
    keyboardAudio.setVolume(Number(elements.volumeRange.value) / 100);
  });
  window.addEventListener('beforeunload', () => {
    clearInterval(app.timerId);
    keyboardAudio.destroy();
  });
}

wireEvents();
keyboardAudio.preload();
syncSoundControls();
updateMistakeBadge();
showStage('import');