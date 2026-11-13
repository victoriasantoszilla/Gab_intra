let demandas = JSON.parse(localStorage.getItem('demandas_gabinete')) || [];

const formDemanda = document.getElementById('formDemanda');
const tabelaDemandasBody = document.getElementById('tabelaDemandasBody');
const totalDemandasSpan = document.getElementById('totalDemandas');
const selectCategoria = document.getElementById('categoria');
const divOutrosEspecificar = document.getElementById('divOutrosEspecificar');

// Função para mostrar ou esconder o campo de especificação de "Outros"
function verificarCategoriaOutros() {
  if (selectCategoria.value === 'Outros') {
    divOutrosEspecificar.classList.remove('hidden');
    document.getElementById('outroEspecificacao').setAttribute('required', 'true');
  } else {
    divOutrosEspecificar.classList.add('hidden');
    document.getElementById('outroEspecificacao').removeAttribute('required');
    document.getElementById('outroEspecificacao').value = '';
  }
}

// 1. EVENTO DE CADASTRO DE NOVA DEMANDA
formDemanda.addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim().replace(/\D/g, '');
  const rua = document.getElementById('rua').value.trim();
  const bairro = document.getElementById('bairro').value.trim();
  const origem = document.getElementById('origem').value;
  
  let categoria = selectCategoria.value;
  if (categoria === 'Outros') {
    const especificacao = document.getElementById('outroEspecificacao').value.trim();
    if (especificacao) {
      categoria = `Outros (${especificacao})`;
    }
  }

  const descricao = document.getElementById('descricao').value.trim();

  const novaDemanda = {
    id: Date.now(),
    protocolo: Math.floor(1000 + Math.random() * 9000),
    nome,
    telefone,
    rua,
    bairro,
    origem,
    categoria,
    descricao,
    status: 'Pendente',
    dataCriacao: new Date().toLocaleDateString('pt-BR')
  };

  demandas.unshift(novaDemanda);
  salvarNoLocalStorage();

  formDemanda.reset();
  verificarCategoriaOutros(); // Reseta a visibilidade do campo outros
  renderizarTabela();
});

// 2. FUNÇÃO PARA SALVAR NO LOCALSTORAGE
function salvarNoLocalStorage() {
  localStorage.setItem('demandas_gabinete', JSON.stringify(demandas));
}

// 3. FUNÇÃO PARA RENDERIZAR A TABELA DINÂMICA
function renderizarTabela() {
  tabelaDemandasBody.innerHTML = '';
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

    let tagOrigemCor = 'bg-gray-100 text-gray-700';
    if (demanda.origem === 'WhatsApp') tagOrigemCor = 'bg-emerald-100 text-emerald-800';
    if (demanda.origem === 'Instagram') tagOrigemCor = 'bg-pink-100 text-pink-800';
    if (demanda.origem === 'Presencial') tagOrigemCor = 'bg-amber-100 text-amber-800';

    let statusCor = 'bg-yellow-100 text-yellow-800';
    if (demanda.status === 'Em Andamento') statusCor = 'bg-blue-100 text-blue-800';
    if (demanda.status === 'Resolvido') statusCor = 'bg-green-100 text-green-800';

    tr.innerHTML = `
      <td class="py-3 px-3">
        <div class="font-semibold text-gray-800">${escapeHtml(demanda.nome)}</div>
        <div class="text-xs text-gray-400">Prot. #${demanda.protocolo} • ${demanda.dataCriacao}</div>
        <div class="text-xs text-gray-500 mt-1 line-clamp-1" title="${escapeHtml(demanda.descricao)}"><b>${escapeHtml(demanda.categoria)}</b>: "${escapeHtml(demanda.descricao)}"</div>
      </td>
      <td class="py-3 px-3 text-xs text-gray-600">
        <div class="font-medium text-gray-800">${escapeHtml(demanda.rua)}</div>
        <div class="text-gray-500">Bairro: ${escapeHtml(demanda.bairro)}</div>
      </td>
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
        <button onclick="enviarWhatsApp(${demanda.id})" title="Enviar atualização pelo WhatsApp"
          class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg transition font-medium inline-flex items-center gap-1">
          <span>💬</span> WhatsApp
        </button>
        <button onclick="excluirDemanda(${demanda.id})" title="Excluir Demanda"
          class="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2 py-1.5 rounded-lg transition">
          🗑️
        </button>
      </td>
    `;

    tabelaDemandasBody.appendChild(tr);
  });
}

// 4. FUNÇÃO PARA DISPARAR O WHATSAPP
function enviarWhatsApp(id) {
  const demanda = demandas.find((d) => d.id === id);
  if (!demanda) return;

  if (!demanda.telefone) {
    alert('Esta demanda não possui um número de telefone/WhatsApp cadastrado.');
    return;
  }

  let numTelefone = demanda.telefone;
  if (!numTelefone.startsWith('55') && numTelefone.length <= 11) {
    numTelefone = '55' + numTelefone;
  }

  const textoMensagem = `Olá, ${demanda.nome}! 👋

Aqui é do Gabinete do Vereador. Passando para atualizar sobre a sua solicitação referente a *${demanda.categoria}* na região de *${demanda.rua}, Bairro ${demanda.bairro}* (Protocolo #${demanda.protocolo}).

📌 *Status Atual:* ${demanda.status.toUpperCase()}

Qualquer novidade ou atualização, informaremos você por aqui. Conte conosco! 😊`;

  const urlWhatsApp = `https://wa.me/${numTelefone}?text=${encodeURIComponent(textoMensagem)}`;
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

renderizarTabela();