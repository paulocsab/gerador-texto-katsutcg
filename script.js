(() => {
  'use strict';

  const STORAGE_KEY = 'gerador-texto-katsutcg';
  const FIELD_IDS = ['carta', 'idioma', 'condicao', 'referencia', 'pagamento'];
  const $ = id => document.getElementById(id);
  const form = $('cardForm');

  const status = message => { document.getElementById('status').textContent = message; };

  // Remove data saved by the previous persistent-storage version.
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be blocked by the browser's privacy settings.
  }

  function loadData() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.entries)) return saved;
    } catch {
      // An invalid or unavailable session starts with an empty auction.
    }
    return { entries: [], title: '', defaultDate: '' };
  }

  const data = loadData();
  let entries = data.entries;
  let editingId = null;
  let defaultDate = data.defaultDate || '';
  $('titulo').value = data.title || '';

  function save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        entries,
        title: $('titulo').value,
        defaultDate
      }));
    } catch {
      status('Não foi possível salvar automaticamente neste navegador.');
    }
  }

  const formatDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date || '')
    ? `${date.slice(8, 10)}/${date.slice(5, 7)}`
    : '';

  function cardMessage(card) {
    return `🎴 Carta: ${card.carta || ''}
🗣️ Idioma: ${card.idioma || 'PT-BR'}
🧑🏻‍⚕️ Condição: ${card.condicao || ''}
💸 Referência: ${card.referencia || ''}

🗓️ Pagamento até: ${formatDate(card.pagamento)}
Pix ou Crédito 12x (mais juros da máquina)`;
  }

  function getValues() {
    return Object.fromEntries(FIELD_IDS.map(id => [id, $(id).value.trim()]));
  }

  function allText() {
    const title = $('titulo').value.trim();
    const cards = entries.map(cardMessage).join('\n\n--------------------\n\n');
    return title ? `${title}\n\n${cards}` : cards;
  }

  // Force the same calendar on desktop and mobile; show only DD/MM.
  const picker = flatpickr('#pagamento', {
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd/m',
    allowInput: false,
    disableMobile: true,
    locale: 'pt',
    onReady: (_, __, instance) => {
      instance.altInput.id = 'pagamento-visible';
      document.querySelector('label[for="pagamento"]').htmlFor = 'pagamento-visible';
    },
    onChange: updatePreview
  });

  function updatePreview() {
    $('preview').textContent = cardMessage(getValues());
  }

  function resetForm() {
    editingId = null;
    form.reset();
    $('idioma').value = 'PT';
    picker.setDate(defaultDate, false);
    $('formTitle').textContent = 'Nova carta';
    $('submitBtn').textContent = 'Adicionar carta';
    $('cancelBtn').hidden = true;
    updatePreview();
  }

  function editEntry(id) {
    const entry = entries.find(item => item.id === id);
    if (!entry) return;

    editingId = id;
    FIELD_IDS.filter(field => field !== 'pagamento').forEach(field => {
      $(field).value = entry[field] || '';
    });
    picker.setDate(entry.pagamento || '', false);
    $('formTitle').textContent = 'Editar carta';
    $('submitBtn').textContent = 'Salvar alterações';
    $('cancelBtn').hidden = false;
    updatePreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('carta').focus();
  }

  function deleteEntry(id) {
    const entry = entries.find(item => item.id === id);
    if (!entry || !confirm(`Excluir a mensagem de ${entry.carta}?`)) return;
    entries = entries.filter(item => item.id !== id);
    if (editingId === id) resetForm();
    save();
    render();
  }

  function makeButton(label, className, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.className = className;
    button.addEventListener('click', action);
    return button;
  }

  function render() {
    const container = $('entries');
    container.replaceChildren();
    $('count').textContent = entries.length;

    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Nenhuma carta adicionada ainda.';
      container.append(empty);
    }

    entries.forEach((entry, index) => {
      const article = document.createElement('article');
      article.className = 'entry';
      const header = document.createElement('div');
      header.className = 'entryhead';
      const name = document.createElement('strong');
      name.textContent = `${index + 1}. ${entry.carta}`;
      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.append(
        makeButton('Editar', '', () => editEntry(entry.id)),
        makeButton('Excluir', 'danger', () => deleteEntry(entry.id))
      );
      header.append(name, actions);
      const text = document.createElement('pre');
      text.textContent = cardMessage(entry);
      article.append(header, text);
      container.append(article);
    });

    ['exportBtn', 'copyBtn', 'clearBtn'].forEach(id => {
      $(id).disabled = entries.length === 0;
    });
  }

  function validateTitle() {
    if ($('titulo').value.trim()) return true;
    status('Preencha o título antes de copiar ou exportar.');
    $('titulo').focus();
    return false;
  }

  form.addEventListener('input', updatePreview);
  form.addEventListener('change', updatePreview);
  $('titulo').addEventListener('input', save);
  $('cancelBtn').addEventListener('click', resetForm);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const card = getValues();

    if (!card.pagamento) {
      status('Selecione uma data de pagamento.');
      picker.open();
      return;
    }
    if (!FIELD_IDS.every(id => card[id])) {
      status('Preencha todos os campos da carta.');
      return;
    }

    if (editingId !== null) {
      entries = entries.map(entry => entry.id === editingId ? { ...entry, ...card } : entry);
    } else {
      entries.push({
        ...card,
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
      });
      defaultDate = card.pagamento;
    }

    save();
    resetForm();
    render();
    status('Carta salva.');
  });

  $('exportBtn').addEventListener('click', () => {
    if (!validateTitle()) return;
    const safeTitle = $('titulo').value.trim().replace(/[\\/:*?"<>|\x00-\x1f]/g, '').replace(/[. ]+$/g, '');
    const blob = new Blob(['\ufeff', allText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeTitle || 'mensagens-cartas'}.txt`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $('copyBtn').addEventListener('click', async () => {
    if (!validateTitle()) return;
    try {
      await navigator.clipboard.writeText(allText());
      status('Mensagens copiadas!');
    } catch {
      status('Não foi possível copiar automaticamente. Use o arquivo .txt.');
    }
  });

  $('clearBtn').addEventListener('click', () => {
    if (!confirm('Excluir todas as mensagens?')) return;
    entries = [];
    save();
    resetForm();
    render();
    status('Todas as cartas foram excluídas.');
  });

  resetForm();
  render();
})();



