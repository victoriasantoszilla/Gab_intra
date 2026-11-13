// array para armazenar as demandas na memória local
let demandas = JSON.parse(localStorage.getItem('demandas_gabinete')) || [];

// Elementos do DOM
const formDemanda = document.getElementById('formDemanda');
const tabelaDemandasBody = document.getElementById('tabelaDemandasBody');
const totalDemandasSpan = document.getElementById('totalDemandas');

// 1. EVENTO DE CADASTRO DE NOVA DEMANDA
formDemanda.addEventListener('submit', function (e) {
  e.preventDefault();

  // Capturando valores dos campos
  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim().replace(/\D/g, ''); // limpa caracteres não numéricos
  const bairro = document.getElementById('bairro').value;
  const origem = document.getElementById('origem').value;
  const categoria = document.getElementById('categoria').value;
  const descricao = document.getElementById('descricao').value.trim();

  // Criando o objeto da nova demanda
  const novaDemanda = {
    id: Date.now(), // ID único baseado no timestamp
    protocolo: Math.floor(1000 + Math.random() * 9000), // Protocolo de 4 dígitos
    nome,
    telefone,
    bairro,
    origem,
    categoria,
    descricao,
    status: 'Pendente', // Status inicial padrão
    dataCriacao: new Date().toLocaleDateString('pt-BR')
  };

  // Adicionando ao array e salvando no localStorage
  demandas.unshift(novaDemanda); // Adiciona no início da lista
  salvarNoLocalStorage();

  // Limpando o formulário e atualizando a tela
  formDemanda.reset();
  renderizarTabela();
});

// 2. FUNÇÃO PARA SALVAR NO LOCALSTORAGE
function salvarNoLocalStorage() {
  localStorage.setItem('demandas_gabinete', JSON.stringify(demandas));
}

// 3. FUNÇÃO PARA RENDERIZAR A TABELA DINÂMICA
function renderizarTabela() {
  tabelaDemandasBody.innerHTML = '';

  // Atualiza contador total
  totalDemandasSpan.innerText = `Total: ${demandas.length} registradas`;

  if (demandas.length === 0) {
    tabelaDemandasBody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-gray-400 text-xs italic">
          Nenhuma demanda cadastrada no momento. Use o formulário ao lado.
        </td>
      </tr>`;
    return;
  }

  demandas.forEach((demanda) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition duration-150 border-b border-gray-100';

    // Cor da tag de Origem
    let tagOrigemCor = 'bg-gray-100 text-gray-700';
    if (demanda.origem === 'WhatsApp') tagOrigemCor = 'bg-emerald-100 text-emerald-800';
    if (demanda.origem === 'Instagram') tagOrigemCor = 'bg-pink-100 text-pink-800';
    if (demanda.origem === 'Presencial') tagOrigemCor = 'bg-amber-100 text-amber-800';

    // Cor do Status
    let statusCor = 'bg-yellow-100 text-yellow-800';
    if (demanda.status === 'Em Andamento') statusCor = 'bg-blue-100 text-blue-800';
    if (demanda.status === 'Resolvido') statusCor = 'bg-green-100 text-green-800';

    tr.innerHTML = `
      <td class="py-3 px-3">
        <div class="font-semibold text-gray-800">${escapeHtml(demanda.nome)}</div>
        <div class="text-xs text-gray-400">Prot. #${demanda.protocolo} • ${demanda.dataCriacao}</div>
        <div class="text-xs text-gray-500 mt-1 line-clamp-1" title="${escapeHtml(demanda.descricao)}">${escapeHtml(demanda.categoria)}: "${escapeHtml(demanda.descricao)}"</div>
      </td>
      <td class="py-3 px-3 text-xs text-gray-600 font-medium">${escapeHtml(demanda.bairro)}</td>
      <td class="py-3 px-3">
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${tagOrigemCor}">
          ${demanda.origem}
        </span>
      </td>
      <td class="py-3 px-3">
        <select onchange="alterarStatus(${demanda.id}, this.value)" 
          class="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-200 cursor-pointer focus:outline-none ${statusCor}">
          <option value="Pendente" ${demanda.status === 'Pendente' ? 'selected' : ''}>⏳ Pendente</option>
          <option value="Em Andamento" ${demanda.status === 'Em Andamento' ? 'selected' : ''}>🔄 Em Andamento</option>
          <option value="Resolvido" ${demanda.status === 'Resolvido' ? 'selected' : ''}>✅ Resolvido</option>
        </select>
      </td>
      <td class="py-3 px-3 text-center space-x-1">
        <!-- Botão Disparo de WhatsApp -->
        <button onclick="enviarWhatsApp(${demanda.id})" title="Enviar atualização pelo WhatsApp"
          class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg transition font-medium inline-flex items-center gap-1">
          <span>💬</span> WhatsApp
        </button>
        <!-- Botão Excluir -->
        <button onclick="excluirDemanda(${demanda.id})" title="Excluir Demanda"
          class="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2 py-1.5 rounded-lg transition">
          🗑️
        </button>
      </td>
    `;

    tabelaDemandasBody.appendChild(tr);
  });
}

// 4. FUNÇÃO PARA DISPARAR O WHATSAPP COM MENSAGEM DINÂMICA
function enviarWhatsApp(id) {
  const demanda = demandas.find((d) => d.id === id);
  if (!demanda) return;

  if (!demanda.telefone) {
    alert('Esta demanda não possui um número de telefone/WhatsApp cadastrado.');
    return;
  }

  // Ajusta DDI 55 do Brasil se não estiver incluído
  let numTelefone = demanda.telefone;
  if (!numTelefone.startsWith('55') && numTelefone.length <= 11) {
    numTelefone = '55' + numTelefone;
  }

  // Criação da mensagem dinâmica personalizada
  const textoMensagem = `Olá, ${demanda.nome}! 👋

Aqui é do Gabinete do Vereador. Passando para atualizar sobre a sua solicitação referente a *${demanda.categoria}* no bairro *${demanda.bairro}* (Protocolo #${demanda.protocolo}).

📌 *Status Atual:* ${demanda.status.toUpperCase()}

Qualquer novidade ou atualização sobre a sua demanda, informaremos você por aqui. Conte conosco! 😊`;

  // URL Encode para montar a chamada de link do WhatsApp
  const urlWhatsApp = `https://wa.me/${numTelefone}?text=${encodeURIComponent(textoMensagem)}`;

  // Abre o WhatsApp Web / App em uma nova aba
  window.open(urlWhatsApp, '_blank');
}

// 5. ALTERAR STATUS
function alterarStatus(id, novoStatus) {
  const demanda = demandas.find((d) => d.id === id);
  if (demanda) {
    demanda.status = novoStatus;
    salvarNoLocalStorage();
    renderizarTabela();
  }
}

// 6. EXCLUIR DEMANDA
function excluirDemanda(id) {
  if (confirm('Tem certeza que deseja excluir este registro?')) {
    demandas = demandas.filter((d) => d.id !== id);
    salvarNoLocalStorage();
    renderizarTabela();
  }
}

// Auxiliar para evitar problemas de XSS nos textos inseridos pelo usuário
function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

// Renderiza a tabela ao carregar a página
renderizarTabela();