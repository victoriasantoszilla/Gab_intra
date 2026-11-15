/**
 * Intranet do Gabinete - Sistema de Gestão de Demandas
 * Módulo Core + Exportação + Relatório Executivo (QA Standard)
 */

const STORAGE_KEY = 'demandas_gabinete_v2';

let state = {
  demandas: carregarDemandas(),
  termoBusca: ''
};

function carregarDemandas() {
  try {
    const dados = localStorage.getItem(STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
  } catch (error) {
    console.error('QA Error: Falha ao ler o localStorage.', error);
    return [];
  }
}

function persistirDados() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.demandas));
  } catch (error) {
    console.error('QA Error: Falha ao gravar no localStorage.', error);
    alert('Erro crítico: O armazenamento local está cheio ou bloqueado.');
  }
}

const DOM = {
  formDemanda: document.getElementById('formDemanda'),
  tabelaBody: document.getElementById('tabelaDemandasBody'),
  totalSpan: document.getElementById('totalDemandas'),
  selectCategoria: document.getElementById('categoria'),
  divOutros: document.getElementById('divOutrosEspecificar'),
  inputOutros: document.getElementById('outroEspecificacao'),
  inputBusca: document.getElementById('inputBusca'),
  
  // Modal Câmara
  modalCamara: document.getElementById('modalCamara'),
  formModal: document.getElementById('formModalCamara'),
  modalId: document.getElementById('modalDemandaId'),
  modalIndicacao: document.getElementById('modalIndicacao'),
  modalProcesso: document.getElementById('modalProcesso'),
  modalSubtitulo: document.getElementById('modalSubtitulo'),

  // Modal Relatório Executivo
  modalRelatorio: document.getElementById('modalRelatorio'),
  textoRelatorio: document.getElementById('textoRelatorio')
};

function verificarCategoriaOutros() {
  const isOutros = DOM.selectCategoria.value === 'Outros';
  DOM.divOutros.classList.toggle('hidden', !isOutros);
  if (isOutros) {
    DOM.inputOutros.setAttribute('required', 'true');
  } else {
    DOM.inputOutros.removeAttribute('required');
    DOM.inputOutros.value = '';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizarTelefone(tel) {
  const apenasNumeros = tel.replace(/\D/g, '');
  if (!apenasNumeros.startsWith('55') && apenasNumeros.length <= 11) {
    return '55' + apenasNumeros;
  }
  return apenasNumeros;
}

// --- FLUXO DE CADASTRO ---
DOM.formDemanda.addEventListener('submit', (e) => {
  e.preventDefault();

  try {
    const nome = DOM.formDemanda.querySelector('#nome').value.trim();
    const telefone = sanitizarTelefone(DOM.formDemanda.querySelector('#telefone').value);
    const rua = DOM.formDemanda.querySelector('#rua').value.trim();
    const bairro = DOM.formDemanda.querySelector('#bairro').value.trim();
    const origem = DOM.formDemanda.querySelector('#origem').value;
    
    let categoria = DOM.selectCategoria.value;
    if (categoria === 'Outros') {
      const spec = DOM.inputOutros.value.trim();
      if (spec) categoria = `Outros (${spec})`;
    }

    const descricao = DOM.formDemanda.querySelector('#descricao').value.trim();

    if (!nome || !telefone || !rua || !bairro || !descricao) {
      throw new Error('Preencha todos os campos obrigatórios.');
    }

    const novaDemanda = {
      id: Date.now(),
      protocolo: Math.floor(1000 + Math.random() * 9000),
      nome,
      telefone,
      rua,
      bairro,
      origem,
      categoria,
      indicacao: '',
      processo: '',
      descricao,
      status: 'Pendente',
      dataCriacao: new Date().toLocaleDateString('pt-BR')
    };

    state.demandas.unshift(novaDemanda);
    persistirDados();

    DOM.formDemanda.reset();
    verificarCategoriaOutros();
    renderizarPainel();

  } catch (error) {
    console.error('QA Validation Error:', error);
    alert(error.message);
  }
});

// --- MODAL DA CÂMARA ---
function abrirModalCamara(id) {
  const demanda = state.demandas.find(d => d.id === id);
  if (!demanda) return;

  DOM.modalId.value = demanda.id;
  DOM.modalIndicacao.value = demanda.indicacao || '';
  DOM.modalProcesso.value = demanda.processo || '';
  DOM.modalSubtitulo.innerText = `Solicitante: ${demanda.nome} (Prot. #${demanda.protocolo})`;

  DOM.modalCamara.classList.remove('hidden');
  DOM.modalCamara.classList.add('flex');
}

function fecharModalCamara() {
  DOM.modalCamara.classList.add('hidden');
  DOM.modalCamara.classList.remove('flex');
}

DOM.formModal.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = Number(DOM.modalId.value);
  const demanda = state.demandas.find(d => d.id === id);

  if (demanda) {
    demanda.indicacao = DOM.modalIndicacao.value.trim();
    demanda.processo = DOM.modalProcesso.value.trim();
    persistirDados();
    renderizarPainel();
  }
  fecharModalCamara();
});

// --- MODAL DE RELATÓRIO EXECUTIVO PARA O VEREADOR ---
function abrirRelatorioExecutivo() {
  const total = state.demandas.length;
  const pendentes = state.demandas.filter(d => d.status === 'Pendente').length;
  const emAndamento = state.demandas.filter(d => d.status === 'Em Andamento').length;
  const resolvidos = state.demandas.filter(d => d.status === 'Resolvido').length;
  const comIndicacao = state.demandas.filter(d => d.indicacao || d.processo).length;

  const dataHoje = new Date().toLocaleDateString('pt-BR');

  let relatorio = `📊 *RELATÓRIO EXECUTIVO DO GABINETE*
📅 Data de Emissão: ${dataHoje}

📌 *SUMÁRIO GERAL DE DEMANDAS*
• Total Registradas: ${total}
• ⏳ Pendentes: ${pendentes}
• 🔄 Em Andamento / Câmara: ${emAndamento}
• ✅ Resolvidas: ${resolvidos}
• 📄 Demandas com Indicação/Processo Oficial: ${comIndicacao}

`;

  if (total > 0) {
    relatorio += `📋 *ÚLTIMAS DEMANDAS CADASTRADAS:*`;
    state.demandas.slice(0, 5).forEach((d, idx) => {
      const indText = d.indicacao ? ` | Ind: ${d.indicacao}` : '';
      relatorio += `\n${idx + 1}. [${d.status}] ${d.nome} (${d.bairro}) - ${d.categoria}${indText}`;
    });
  } else {
    relatorio += `*(Nenhuma demanda cadastrada no período)*`;
  }

  relatorio += `\n\n_Relatório gerado automaticamente pelo Sistema Gabinete Digital._`;

  DOM.textoRelatorio.value = relatorio;
  DOM.modalRelatorio.classList.remove('hidden');
  DOM.modalRelatorio.classList.add('flex');
}

function fecharRelatorioExecutivo() {
  DOM.modalRelatorio.classList.add('hidden');
  DOM.modalRelatorio.classList.remove('flex');
}

function copiarRelatorio() {
  DOM.textoRelatorio.select();
  navigator.clipboard.writeText(DOM.textoRelatorio.value)
    .then(() => alert('Relatório copiado para a área de transferência! Pronto para colar no WhatsApp ou E-mail.'))
    .catch(() => alert('Erro ao copiar relatório.'));
}

// --- AÇÕES DA TABELA ---
function alterarStatus(id, novoStatus) {
  const demanda = state.demandas.find(d => d.id === id);
  if (demanda) {
    demanda.status = novoStatus;
    persistirDados();
    renderizarPainel();
  }
}

function excluirDemanda(id) {
  if (confirm('QA Alerta: Tem certeza que deseja remover permanentemente este registro?')) {
    state.demandas = state.demandas.filter(d => d.id !== id);
    persistirDados();
    renderizarPainel();
  }
}

function enviarWhatsApp(id) {
  const demanda = state.demandas.find(d => d.id === id);
  if (!demanda || !demanda.telefone) {
    alert('Erro: Número de telefone inválido ou ausente.');
    return;
  }

  let blocoCamara = '';
  if (demanda.indicacao || demanda.processo) {
    blocoCamara = `\n\n📄 *Tramitação Oficial na Câmara:*`;
    if (demanda.indicacao) blocoCamara += `\n• *Indicação:* ${demanda.indicacao}`;
    if (demanda.processo) blocoCamara += `\n• *Processo:* ${demanda.processo}`;
  }

  const mensagem = `Olá, ${demanda.nome}! 👋

Aqui é do Gabinete do Vereador. Passando para atualizar sobre a sua solicitação de *${demanda.categoria}* na região de *${demanda.rua}, Bairro ${demanda.bairro}* (Protocolo #${demanda.protocolo}).

📌 *Status Atual:* ${demanda.status.toUpperCase()}${blocoCamara}

Qualquer novidade, informaremos por aqui. Conte conosco! 😊`;

  const url = `https://wa.me/${demanda.telefone}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

// --- MÓDULO DE EXPORTAÇÃO (CSV & JSON) ---
function exportarCSV() {
  if (state.demandas.length === 0) {
    alert('Não há dados cadastrados para exportar.');
    return;
  }

  let csvContent = '\uFEFFProtocolo;Data;Nome;Telefone;Rua;Bairro;Origem;Categoria;Indicacao;Processo;Status;Descricao\r\n';

  state.demandas.forEach(d => {
    const linha = [
      d.protocolo,
      d.dataCriacao,
      `"${(d.nome || '').replace(/"/g, '""')}"`,
      `"${(d.telefone || '').replace(/"/g, '""')}"`,
      `"${(d.rua || '').replace(/"/g, '""')}"`,
      `"${(d.bairro || '').replace(/"/g, '""')}"`,
      d.origem,
      `"${(d.categoria || '').replace(/"/g, '""')}"`,
      `"${(d.indicacao || '').replace(/"/g, '""')}"`,
      `"${(d.processo || '').replace(/"/g, '""')}"`,
      d.status,
      `"${(d.descricao || '').replace(/"/g, '""')}"`
    ].join(';');

    csvContent += linha + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `demandas_gabinete_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarJSON() {
  if (state.demandas.length === 0) {
    alert('Não há dados para backup.');
    return;
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.demandas, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `backup_gabinete_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- RENDERIZAÇÃO DA INTERFACE ---
function filtrarDemandas() {
  const termo = DOM.inputBusca ? DOM.inputBusca.value.toLowerCase().trim() : '';
  return state.demandas.filter(d => {
    return (
      d.nome.toLowerCase().includes(termo) ||
      d.rua.toLowerCase().includes(termo) ||
      d.bairro.toLowerCase().includes(termo) ||
      d.categoria.toLowerCase().includes(termo) ||
      d.protocolo.toString().includes(termo) ||
      (d.indicacao && d.indicacao.toLowerCase().includes(termo)) ||
      (d.processo && d.processo.toLowerCase().includes(termo))
    );
  });
}

function renderizarPainel() {
  DOM.tabelaBody.innerHTML = '';
  const filtradas = filtrarDemandas();

  DOM.totalSpan.innerText = `Total: ${filtradas.length} de ${state.demandas.length}`;

  if (filtradas.length === 0) {
    DOM.tabelaBody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-gray-400 text-xs italic">
          Nenhuma demanda encontrada.
        </td>
      </tr>`;
    return;
  }

  filtradas.forEach(demanda => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition duration-150 border-b border-gray-100';

    let corOrigem = 'bg-gray-100 text-gray-700';
    if (demanda.origem === 'WhatsApp') corOrigem = 'bg-emerald-100 text-emerald-800';
    if (demanda.origem === 'Instagram') corOrigem = 'bg-pink-100 text-pink-800';
    if (demanda.origem === 'Presencial') corOrigem = 'bg-amber-100 text-amber-800';

    let corStatus = 'bg-yellow-100 text-yellow-800';
    if (demanda.status === 'Em Andamento') corStatus = 'bg-blue-100 text-blue-800';
    if (demanda.status === 'Resolvido') corStatus = 'bg-green-100 text-green-800';

    let badgeCamara = `<div class="text-[11px] text-gray-400 mt-1 italic">Sem protocolo oficial</div>`;
    if (demanda.indicacao || demanda.processo) {
      badgeCamara = `<div class="mt-1.5 bg-blue-50 border border-blue-100 rounded px-2 py-1 text-xs text-blue-800 space-y-0.5">`;
      if (demanda.indicacao) badgeCamara += `<div><b>Ind:</b> ${escapeHtml(demanda.indicacao)}</div>`;
      if (demanda.processo) badgeCamara += `<div><b>Proc:</b> ${escapeHtml(demanda.processo)}</div>`;
      badgeCamara += `</div>`;
    }

    const temProtocolo = Boolean(demanda.indicacao || demanda.processo);
    const classeBtnCamara = temProtocolo 
      ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300' 
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200';

    tr.innerHTML = `
      <td class="py-3 px-3">
        <div class="font-semibold text-gray-800">${escapeHtml(demanda.nome)}</div>
        <div class="text-xs text-gray-400">Prot. #${demanda.protocolo} • ${demanda.dataCriacao}</div>
        <div class="text-xs text-gray-600 mt-1 line-clamp-1" title="${escapeHtml(demanda.descricao)}"><b>${escapeHtml(demanda.categoria)}</b>: "${escapeHtml(demanda.descricao)}"</div>
      </td>
      <td class="py-3 px-3 text-xs text-gray-600">
        <div class="font-medium text-gray-800">${escapeHtml(demanda.rua)}</div>
        <div class="text-gray-500">Bairro: ${escapeHtml(demanda.bairro)}</div>
      </td>
      <td class="py-3 px-3">
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${corOrigem}">
          ${demanda.origem}
        </span>
        ${badgeCamara}
      </td>
      <td class="py-3 px-3">
        <select onchange="alterarStatus(${demanda.id}, this.value)" 
          class="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-200 cursor-pointer focus:outline-none ${corStatus}">
          <option value="Pendente" ${demanda.status === 'Pendente' ? 'selected' : ''}>⏳ Pendente</option>
          <option value="Em Andamento" ${demanda.status === 'Em Andamento' ? 'selected' : ''}>🔄 Em Andamento</option>
          <option value="Resolvido" ${demanda.status === 'Resolvido' ? 'selected' : ''}>✅ Resolvido</option>
        </select>
      </td>
      <td class="py-3 px-3 text-center">
        <div class="flex items-center justify-center gap-1.5 flex-wrap">
          <button onclick="abrirModalCamara(${demanda.id})" title="Vincular dados oficiais"
            class="${classeBtnCamara} text-xs px-2.5 py-1.5 rounded-lg transition font-medium inline-flex items-center gap-1">
            <span>📄</span> Câmara
          </button>
          <button onclick="enviarWhatsApp(${demanda.id})" title="Enviar WhatsApp"
            class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1.5 rounded-lg transition font-medium inline-flex items-center gap-1">
            <span>💬</span> WhatsApp
          </button>
          <button onclick="excluirDemanda(${demanda.id})" title="Excluir"
            class="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2 py-1.5 rounded-lg transition">
            🗑️
          </button>
        </div>
      </td>
    `;

    DOM.tabelaBody.appendChild(tr);
  });
}

if (DOM.inputBusca) {
  DOM.inputBusca.addEventListener('input', () => {
    renderizarPainel();
  });
}

renderizarPainel();