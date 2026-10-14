'use strict';



// ============================================
// 1. ARRAYS E LOCALSTORAGE
let arrayEstabelecimentos = JSON.parse(localStorage.getItem('cadastroEstabelecimento')) || [];
let arrayProdutos = JSON.parse(localStorage.getItem('cadastroProduto')) || [];
let arrayCategorias = JSON.parse(localStorage.getItem('cadastroCategoria')) || [];

// ============================================
// 2. CLASSES
class Estabelecimento {
    constructor(
        id,
        nome,
        cidade,
        endereco,
        numero,
        bairro,
        status,
        contato,
        nota = 0
    ) {
        this.id = id;
        this.estabelecimento = nome;
        this.cidade = cidade;
        this.endereco = endereco;
        this.numero = numero;
        this.bairro = bairro;
        this.status = status;
        this.contato = contato;
        this.nota = nota;
    }
}

class Produto {
    constructor(
        id,
        dataCadastro,
        foto,
        codigoBarras,
        categoria,
        nomeProduto,
        estabelecimento,
        qtdKit,
        volume,
        valorEmbalagem,
        valorUnitario,
        valorTotalPagar
    ) {
        this.id = id;
        this.dataCadastro = dataCadastro;
        this.foto = foto;
        this.codigoBarras = codigoBarras;
        this.categoria = categoria;
        this.nomeProduto = nomeProduto;
        this.estabelecimento = estabelecimento;
        this.qtdKit = qtdKit;
        this.volume = volume;
        this.valorEmbalagem = valorEmbalagem;
        this.valorUnitario = valorUnitario;
        this.valorTotalPagar = valorTotalPagar;
    }
}

class Categoria {
    constructor(id, nome) {
        this.id = id;
        this.nome = nome;
    }
}

// 3. API DO IBGE
const API_IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades';

// 4. CARREGAR ESTADOS
async function carregarEstados(idEstado) {
    const selectEstado = document.getElementById(idEstado);

    if (!selectEstado) {
        console.error(`Campo de estado não encontrado: ${idEstado}`);
        return;
    }

    selectEstado.innerHTML = '<option value="">Carregando estados...</option>';

    selectEstado.disabled = true;

    try {
        const resposta = await fetch(
            `${API_IBGE}/estados?orderBy=nome`
        );

        if (!resposta.ok) {
            throw new Error('Não foi possível buscar os estados.');
        }

        const estados = await resposta.json();

        selectEstado.innerHTML = '<option value="">-</option>';

        estados.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado.sigla;
            option.textContent = estado.sigla;
            selectEstado.appendChild(option);
        });

        selectEstado.disabled = false;

    } catch (erro) {
        console.error('Erro ao carregar estados:', erro);

        selectEstado.innerHTML = '<option value="">Erro ao carregar estados</option>';
    }
}

// 5. CARREGAR CIDADES
async function carregarCidades(siglaEstado, selectCidade) {
    if (!selectCidade) {
        console.error('Campo de cidade não encontrado.');
        return;
    }

    selectCidade.innerHTML =
        '<option value="">Carregando cidades...</option>';

    selectCidade.disabled = true;

    if (!siglaEstado) {
        selectCidade.innerHTML =
            '<option value="">Selecione primeiro um estado</option>';
        return;
    }

    try {
        const resposta = await fetch(
            `${API_IBGE}/estados/${encodeURIComponent(siglaEstado)}/municipios?orderBy=nome`
        );

        if (!resposta.ok) {
            throw new Error('Não foi possível buscar os municípios.');
        }

        const cidades = await resposta.json();

        selectCidade.innerHTML =
            '<option value="">Selecione uma cidade</option>';

        cidades.forEach(cidade => {
            const option = document.createElement('option');

            // O valor salvo será o código IBGE do município.
            option.value = cidade.id;

            // O texto exibido será o nome do município.
            option.textContent = cidade.nome;

            selectCidade.appendChild(option);
        });

        selectCidade.disabled = false;

    } catch (erro) {
        console.error('Erro ao carregar cidades:', erro);
        selectCidade.innerHTML = '<option value="">Erro ao carregar cidades</option>';
    }
}

// 6. CONFIGURAR ESTADO E CIDADE
function configurarEstadosECidades(idEstado, idCidade) {
    const selectEstado = document.getElementById(idEstado);
    const selectCidade = document.getElementById(idCidade);

    if (!selectEstado || !selectCidade) {
        console.error(
            `Campo de estado ou cidade não encontrado: ${idEstado}, ${idCidade}`
        );
        return;
    }

    // Cidade começa desabilitada.
    selectCidade.innerHTML =
        '<option value="">Selecione primeiro um estado</option>';

    selectCidade.disabled = true;

    // Carrega os estados no select correspondente.
    carregarEstados(idEstado);

    // Ao selecionar um estado, carrega suas cidades.
    selectEstado.addEventListener('change', function () {
        carregarCidades(this.value, selectCidade);
    });
}

// 7. GERAR IDs
function geraId(alias, nomeArray, inputID) {
    const campoID = document.getElementById(inputID);

    if (!campoID) {
        console.error(`Campo de ID não encontrado: ${inputID}`);
        return;
    }

    let proximoCodigo;

    if (Array.isArray(nomeArray)) {
        proximoCodigo = nomeArray.length + 1;
    } else if (typeof nomeArray === 'number') {
        proximoCodigo = nomeArray + 1;
    } else {
        proximoCodigo = 1;
    }
    campoID.value = `${alias}_${proximoCodigo}`;
}

function ordenaArray(nomeArray) {
    nomeArray.sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    );
}

// 8. POPULAR SELECTS COM ARRAYS
function populaDados(campoId, array, chave) {
    const campoSelect = document.getElementById(campoId);

    if (!campoSelect) {
        console.error(`Select não encontrado: ${campoId}`);
        return;
    }

    campoSelect.innerHTML = '';
    const optionInicial = document.createElement('option');
    optionInicial.value = '';
    optionInicial.textContent = array.length ? 'Selecione uma opção' : 'Nenhum registro cadastrado';
    campoSelect.appendChild(optionInicial);

    array.forEach(item => {
        const optionCriado = document.createElement('option');

        // Usa a propriedade indicada pelo parâmetro chave.
        optionCriado.value = item.id ?? '';
        optionCriado.textContent = item[chave] ?? '';
        campoSelect.appendChild(optionCriado);
    });
}

// 9. ABRIR FORMULÁRIO DINÂMICO
function abreCampoCadastro(tipo) {
    const localCampo = document.getElementById('campoCadastro');
    const cardPrincipal = document.getElementById('cardPrincipalCadastro')
    const localCampoHeader = document.getElementById('campoCadastroHeader');
    const localCampoBody = document.getElementById('campoCadastroBody');

    if (!localCampo || !localCampoHeader || !localCampoBody) {
        console.error(
            'Verifique os elementos campoCadastro, campoCadastroHeader e campoCadastroBody no HTML.'
        );
        return;
    }

    if (localCampo.classList.contains('d-none')) {
        localCampo.classList.replace('d-none', 'd-block');
    }

    localCampoHeader.innerHTML = `
        <div class="row">
            <div class="col d-flex justify-content-center align-items-center">
                <span class="tamanho11">${tipo}</span>
            </div>
            <div class="col-auto">
                <button class="btn btn-sm btn-info" type="button">
                    <i class="fa fa-refresh fa-spin"></i>
                </button>
            </div>
        </div>
    `;

    // FORMULÁRIO DE ESTABELECIMENTOS
    if (tipo === 'Cadastros de Estabelecimentos') {
        localCampoBody.innerHTML = `
            <div class="row">
                <div class="col-lg-1 col-3 mb-3">
                    <label for="inputIDCadastroEstabelecimento" class="labelText">ID</label>
                    <input type="text" id="inputIDCadastroEstabelecimento" class="form-control" disabled>
                </div>

                <div class="col-lg-6 col-9 mb-3">
                    <label for="selectESTABELECIMENTOCadastroEstabelecimento" class="labelText">Nome do Estabelecimento</label>
                    <div class="input-group">
                        <select class="form-select" id="selectESTABELECIMENTOCadastroEstabelecimento"></select>
                        <button class="btn btn-sm btn-dark input-group-text" type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#collapseNovoEstabelecimento">
                            <i class="fa fa-plus"></i>
                        </button>
                    </div>
                </div>

                <div class="col-3 col-lg-1 mb-3">
                    <label for="selectESTADOCadastroEstabelecimento" class="labelText">Estado</label>
                    <select class="form-select" id="selectESTADOCadastroEstabelecimento"></select>
                </div>

                <div class="col mb-3">
                    <label for="selectCIDADECadastroEstabelecimento" class="labelText">Cidade</label>
                    <select id="selectCIDADECadastroEstabelecimento" class="form-select" disabled>
                        <option value="">
                            Selecione primeiro um estado
                        </option>
                    </select>
                </div>
            </div>

            <!-- COLLAPSE NOVO ESTABELECIMENTO -->
            <div class="row collapse" id="collapseNovoEstabelecimento">
                <div class="col">
                    <div class="card">
                        <div class="card-header bg-primary text-light flexCenter">
                            <i class="fa fa-shop"></i>&nbsp;&nbsp;
                            <span class="uppercase tamanho08 fw-bold">
                                Cadastro de Novo Estabelecimento
                            </span>
                        </div>

                        <div class="card-body">
                            <div class="row">
                                <div class="mb-3 col-lg-1 col-3">
                                    <label for="inputIdEstabelecimento" class="labelText">ID</label>
                                    <input type="text" id="inputIdEstabelecimento" class="form-control" disabled>
                                </div>

                                <div class="mb-3 col-lg-5 col-9">
                                    <label for="inputNomeEstabelecimento" class="labelText">Nome</label>
                                    <input type="text" id="inputNomeEstabelecimento" class="form-control" required>
                                </div>

                                <div class="mb-3 col-lg-1 col-3">
                                    <label for="selectEstadoEstabelecimento" class="labelText">Estado</label>
                                    <select id="selectEstadoEstabelecimento" class="form-select" required>
                                        <option value="">
                                            -
                                        </option>
                                    </select>
                                </div>

                                <div class="mb-3 col-lg-5 col-9">
                                    <label for="selectCidadeEstabelecimento" class="labelText">Cidade</label>
                                    <select id="selectCidadeEstabelecimento" class="form-select" disabled required>
                                        <option value="">
                                            Selecione primeiro um estado
                                        </option>
                                    </select>
                                </div>

                                <div class="mb-3 col-lg-5">
                                    <label for="inputEnderecoEstabelecimento" class="labelText">Endereço</label>
                                    <input type="text" id="inputEnderecoEstabelecimento" class="form-control">
                                </div>

                                <div class="mb-3 col-lg-1 col-3">
                                    <label for="inputNumeroEstabelecimento" class="labelText">Número</label>
                                    <input type="text" id="inputNumeroEstabelecimento" class="form-control">
                                </div>

                                <div class="mb-3 col-lg-4 col-9">
                                    <label for="inputBairroEstabelecimento" class="labelText">Bairro</label>
                                    <input type="text" id="inputBairroEstabelecimento" class="form-control">
                                </div>

                                <div class="mb-3 col-lg">
                                    <label class="labelText">Nota</label>
                                    <div class="row m-auto text-center">
                                        <div class="col" id="avaliacaoEstabelecimento">
                                            <i class="fa fa-star estrela" data-nota="1" value="1"></i>
                                            <i class="fa fa-star estrela" data-nota="2" value="2"></i>
                                            <i class="fa fa-star estrela" data-nota="3" value="3"></i>
                                            <i class="fa fa-star estrela" data-nota="4" value="4"></i>
                                            <i class="fa fa-star estrela" data-nota="5" value="5"></i>
                                        </div>
                                    </div>

                                    <input type="hidden" id="inputNotaEstabelecimento" value="0">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card-footer">
                <div class="row">
                    <div class="col flexCenter gap-2">
                        <button type="button" class="btn btn-sm btn-success"
                        onclick="alert('btn Salvar ${tipo}')">
                            <i class="fa fa-save"></i>&nbsp;&nbsp;
                            <span class="uppercase tamanho08">Salvar</span>
                        </button>

                        <button type="button" class="btn btn-sm btn-primary"
                        onclick="alert('btn Limpar ${tipo}')"
                            <i class="fa fa-broom"></i>&nbsp;&nbsp;
                            <span class="uppercase tamanho08">Limpar</span>
                        </button>
                    </div>
                </div>
            </div>

            <!--LINHA DIVISÓRIA COM BUTTON DE EXIBIÇÃO DE CADASTROS -->
            <div class="row mt-3 mt-lg-0">
                <div class="col">
                    <hr>
                </div>
                <div class="col-auto">
                    <button
                        class="btn btn-dark btn-sm px-3"
                        style="font-size:0.6rem"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#exibicaoEstabelecimentosTodos"
                        aria-expanded="false"
                        aria-controls="exibicaoEstabelecimentosTodos">

                        <span class="uppercase">ver todos ${tipo}</span>&nbsp;&nbsp;&nbsp;
                        <i class="fa fa-eye"></i>
                    </button>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col collapse" id="exibicaoEstabelecimentosTodos"
                    <div class="card">
                        <div class="card-header bg-secondary text-light uppercase tamanho09 text-center">
                            Exibição de todos ${tipo}
                        </div>
                        <div class="card-body" id="cardBody${tipo}"></div>
                    </div>
                </div>
            </div>
        `;

        configurarAvaliacaoEstabelecimento();

        // Configurar os campos de estado e cidade.
        configurarEstadosECidades('selectESTADOCadastroEstabelecimento', 'selectCIDADECadastroEstabelecimento');
        configurarEstadosECidades('selectEstadoEstabelecimento', 'selectCidadeEstabelecimento');

        // Preencher o select com estabelecimentos existentes.
        populaDados('selectESTABELECIMENTOCadastroEstabelecimento', arrayEstabelecimentos, 'estabelecimento');

        // Gerar o ID do novo estabelecimento.
        geraId('est', arrayEstabelecimentos, 'inputIdEstabelecimento');

        // Também preencher o campo de ID da área principal.
        geraId('est', arrayEstabelecimentos, 'inputIDCadastroEstabelecimento');
    }

    // FORMULÁRIO DE PRODUTOS
    else if (tipo === 'Cadastros de Produtos') {
        localCampoBody.innerHTML = `
            <div class="row mt-3">
                
                <div class="col-lg-3 col-12 mb-3">
                    <div class="d-flex flex-column align-items-center gap-2">

                        <!-- Pré-visualização da foto -->
                        <img id="previewFoto"
                            class="p-2"
                            src=""
                            alt="Foto do produto"
                            style="
                                width: 100%;
                                max-width: 300px;
                                height: 200px;
                                object-fit: contain;
                                border: 1px solid lightgray;
                                border-radius: 20px;
                                display: none;">

                        <!-- Câmera ao vivo -->
                        <video id="videoCameraProduto"
                            autoplay
                            playsinline
                            style="
                                width: 100%;
                                max-width: 300px;
                                height: 200px;
                                object-fit: cover;
                                border: 1px solid lightgray;
                                border-radius: 20px;
                                display: none;">
                        </video>

                        <!-- Imagem padrão -->
                        <div id="placeholderFoto"
                            class="d-flex flex-column justify-content-center
                                align-items-center gap-2"
                            style="
                                width: 100%;
                                max-width: 300px;
                                height: 200px;
                                border: 1px dashed lightgray;
                                border-radius: 20px;">

                            <i class="fa fa-image fa-3x text-secondary"></i>

                            <span class="text-secondary small">
                                Sem foto do produto
                            </span>
                        </div>

                        <!-- Botão para abrir a câmera -->
                        <button type="button"
                            id="btnAbrirCameraProduto"
                            class="btn btn-primary btn-sm uppercase"
                            onclick="abrirCameraProduto()"
                            style="font-size: 0.7rem">

                            <i class="fa fa-camera"></i>&nbsp;
                            Tirar foto
                        </button>

                        <!-- Botões exibidos durante a captura -->
                        <div id="botoesCameraProduto"
                            class="d-flex gap-2"
                            style="display: none !important;">

                            <button type="button"
                                class="btn btn-success btn-sm uppercase"
                                onclick="tirarFotoProduto()"
                                style="font-size: 0.7rem">

                                <i class="fa fa-check"></i>&nbsp;
                                Capturar
                            </button>

                            <button type="button"
                                class="btn btn-secondary btn-sm uppercase"
                                onclick="fecharCameraProduto()"
                                style="font-size: 0.7rem">

                                <i class="fa fa-times"></i>&nbsp;
                                Cancelar
                            </button>
                        </div>

                        <!-- Input que receberá a foto -->
                        <input type="file"
                            id="inputFotoProduto"
                            accept="image/*"
                            hidden>

                        <!-- Canvas para capturar a imagem -->
                        <canvas id="canvasFotoProduto" hidden></canvas>

                    </div>
                </div>



                <hr class="d-lg-none">

                <div class="col-lg-9">
                    <div class="row">
                        <div class="col-3 col-lg-2 mb-3">
                            <label for="inputIDCadastroProduto" class="labelText">ID</label>
                            <input type="text" class="form-control" id="inputIDCadastroProduto" disabled>
                        </div>

                        <div class="col-4 col-lg-2 mb-3">
                            <label for="inputDATACadastroProduto" class="labelText">Data</label>
                            <input type="date" class="form-control" id="inputDATACadastroProduto" disabled>
                        </div>

                        <!--CATEGORIA PRODUTO-->
                        <div class="col-5 col-lg mb-3">
                            <label for="selectCATEGORIACadastroProduto" class="labelText">Categoria</label>
                            <div class="input-group">
                                <select class="form-select" id="selectCATEGORIACadastroProduto">
                                    <option value="">-</option>
                                </select>

                                <button class="btn btn-sm btn-dark input-group-text" type="button"
                                onclick="document.getElementById('btnCategorias').click()">
                                    <i class="fa fa-plus"></i>
                                </button>
                            </div>
                        </div>

                        <!--CODIGO DE BARRAS PRODUTO-->
                        <div class="col-12 col-lg-auto mb-3">
                            <label for="inputCodigoBarrasProduto" class="labelText">
                                Código de Barras do Produto
                            </label>
                            <div class="input-group">
                                <input
                                    type="text"
                                    class="form-control"
                                    id="inputCodigoBarrasProduto"
                                    placeholder="Código de barras"
                                >

                                <button
                                    class="btn btn-sm btn-danger input-group-text"
                                    type="button"
                                    onclick="abrirLeitorCodigoBarras()"
                                    title="Ler código de barras">

                                    <i class="fa fa-barcode"></i>
                                </button>
                            </div>

                            <!-- MODAL DO LEITOR -->
                            <div class="modal fade" id="modalLeitorCodigoBarras"
                                tabindex="-1" aria-hidden="true">

                                <div class="modal-dialog modal-dialog-centered">
                                    <div class="modal-content">

                                        <div class="modal-header">
                                            <h5 class="modal-title">
                                                <i class="fa fa-barcode"></i>
                                                Ler código de barras
                                            </h5>

                                            <button type="button" class="btn-close"
                                                data-bs-dismiss="modal"
                                                aria-label="Fechar"
                                                onclick="fecharLeitorCodigoBarras()">
                                            </button>
                                        </div>

                                        <div class="modal-body text-center">
                                            <video id="videoLeitorCodigoBarras"
                                                class="w-100"
                                                autoplay
                                                muted
                                                playsinline
                                                style="max-height: 350px; object-fit: contain;">
                                            </video>

                                            <p id="statusLeitorCodigoBarras"
                                            class="small text-secondary mt-3">
                                                Posicione o código de barras diante da câmera.
                                            </p>
                                        </div>

                                        <div class="modal-footer">
                                            <button type="button"
                                                class="btn btn-secondary"
                                                data-bs-dismiss="modal"
                                                onclick="fecharLeitorCodigoBarras()">
                                                Cancelar
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>

                        <!--NOME PRODUTO-->
                        <div class="col-12 col-lg-5 mb-3">
                            <label for="inputNomeProduto" class="labelText">
                                Nome do Produto
                            </label>
                            <input type="text" class="form-control" id="inputNomeProduto">
                        </div>


                        <!--QTD KIT PRODUTO-->
                        <div class="col-3 col-lg-2 mb-3">
                            <label for="inputQtdKitProduto" class="labelText">
                                Qtd. kit
                            </label>
                            <input type="number" class="form-control"
                            onchange=" calculaValorUnitario()"  
                            id="inputQtdKitProduto" min="1" value="1">
                        </div>


                        <!--VOLUME / PESO PRODUTO-->
                        <div class="col-5 col-lg-3 mb-3">
                            <label for="inputVolumeProduto" class="labelText">
                                Volume / peso
                            </label>
                            <div class="input-group">
                                <input type="number" class="form-control" 
                                onkeydown=" calculaValorUnitario()" 
                                id="inputVolumeProduto" min="1" value="1">

                                <select class="form-select bg-primary text-light" id="inputTipoVolumeProduto">
                                    <option value="">-</option>
                                    <option value="Kg" selected>kg</option>
                                    <option value="G">gms</option>
                                    <option value="Lts">lts</option>
                                    <option value="Ml">ml</option>
                                    <option value="Mts">mts</option>
                                    <option value="Cm">cm</option>
                                </select>
                            </div>
                        </div>

                        <!--VALOR PRODUTO (EMBALAGEM)-->
                        <div class="col-4 col-lg-2 mb-3">
                            <label for="inputValorEmbalagemProduto" class="labelText">
                                V. embalagem
                            </label>
                            <input type="number" class="form-control" 
                            onkeydown=" calculaValorUnitario()" 
                            id="inputValorEmbalagemProduto" min="1" value="1">
                        </div>


                        <!--PREÇO UNITÁRIO POR KIT PRODUTO-->
                        <div class="col-6 col-lg- mb-3">
                            <label for="inputValorUnitarioProduto" class="labelText">
                                P. Unit (kit/qtd)
                            </label>

                            <div class="input-group">
                                <span class="input-group-text bg-success text-light">
                                    <i class="fa fa-brazilian-real-sign"></i>
                                </span>
                                <input type="number" class="form-control" 
                                id="inputValorUnitarioKitProduto" disabled>
                            </div>
                        </div>


                        <!--PREÇO UNITÁRIO VOLUME-->
                        <div class="col-6 col-lg-3 mb-3">
                            <label for="inputValorUnitarioPesoProduto" class="labelText">
                                P. Unit (Volume)
                            </label>

                            <div class="input-group">
                                <span class="input-group-text bg-success text-light">
                                    <i class="fa fa-brazilian-real-sign"></i>
                                </span>
                                <input type="number" class="form-control" 
                                id="inputValorUnitarioPesoProduto" disabled>
                            </div>
                        </div>

                        <div class="card-footer">
                            <div class="row">
                                <div class="col flexCenter gap-2">
                                    <button type="button" class="btn btn-sm btn-success"
                                    onclick="alert('btn Salvar ${tipo}')">
                                        <i class="fa fa-save"></i>&nbsp;&nbsp;
                                        <span class="uppercase tamanho08">Salvar</span>
                                    </button>

                                    <button type="button" class="btn btn-sm btn-primary"
                                    onclick="alert('btn Limpar ${tipo}')"
                                        <i class="fa fa-broom"></i>&nbsp;&nbsp;
                                        <span class="uppercase tamanho08">Limpar</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col">
                        <!--LINHA DIVISÓRIA COM BUTTON DE EXIBIÇÃO DE CADASTROS -->
                        <div class="row mt-3 mt-lg-0">
                            <div class="col">
                                <hr>
                            </div>
                            <div class="col-auto">
                                <button
                                    class="btn btn-dark btn-sm px-3"
                                    style="font-size:0.6rem"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#exibicaoEstabelecimentosTodos"
                                    aria-expanded="false"
                                    aria-controls="exibicaoEstabelecimentosTodos">

                                    <span class="uppercase">ver todos ${tipo}</span>&nbsp;&nbsp;&nbsp;
                                    <i class="fa fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div class="row mt-3">
                            <div class="col collapse" id="exibicaoEstabelecimentosTodos"
                                <div class="card">
                                    <div class="card-header bg-secondary text-light uppercase tamanho09 text-center">
                                        Exibição de todos ${tipo}
                                    </div>
                                    <div class="card-body" id="cardBody${tipo}"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        
        `;


        // Gerar o ID do produto.
        geraId('prd', arrayProdutos, 'inputIDCadastroProduto');

        // Preencher a data atual.
        const campoData = document.getElementById('inputDATACadastroProduto');

        if (campoData) {
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            campoData.value = `${ano}-${mes}-${dia}`;
        }
    }

    // FORMULÁRIO DE CATEGORIAS
    else if (tipo === 'Cadastros de Categorias') {
        localCampoBody.innerHTML = `
            <div class="row flexCenter">
                <div class="col-3 col-lg-1 mb-3">
                    <label for="inputIDCadastroCategoria" class="labelText">id</label>
                    <input type="text" class="form-control" id="inputIDCadastroCategoria" disabled>
                </div>
                <div class="col col-lg-4 mb-3">
                    <label for="inputNOMECadastroCategoria" class="labelText">nome categoria</label>
                    <input type="text" class="form-control" id="inputNOMECadastroCategoria">
                </div>
            </div>

            <div class="card-footer">
                <div class="row">
                    <div class="col flexCenter gap-2">
                        <button type="button" class="btn btn-sm btn-success"
                        onclick="salvarCadastro('cadastroCategoria')">
                            <i class="fa fa-save"></i>&nbsp;&nbsp;
                            <span class="uppercase tamanho08">Salvar</span>
                        </button>

                        <button type="button" class="btn btn-sm btn-primary"
                        onclick="alert('btn Limpar ${tipo}')"
                            <i class="fa fa-broom"></i>&nbsp;&nbsp;
                            <span class="uppercase tamanho08">Limpar</span>
                        </button>
                    </div>
                </div>
            </div>

             <!--LINHA DIVISÓRIA COM BUTTON DE EXIBIÇÃO DE CADASTROS -->
            <div class="row mt-3 mt-lg-0">
                <div class="col">
                    <hr>
                </div>
                <div class="col-auto">
                    <button
                        class="btn btn-dark btn-sm px-3"
                        style="font-size:0.6rem"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#exibicaoCategoriasTodos"
                        aria-expanded="false"
                        aria-controls="exibicaoCategoriasTodos"
                        onclick="popularExibicao('categoria', 'cardBodyExibicaoCategorias', arrayCategorias)">

                        <span class="uppercase">ver todos ${tipo}</span>&nbsp;&nbsp;&nbsp;
                        <i class="fa fa-eye"></i>
                    </button>
                </div>
            </div>

            <div class="row mt-3 collapse" id="exibicaoCategoriasTodos">
                <div class="col"
                    <div class="card">
                        <div class="card-header bg-secondary text-light uppercase tamanho09 text-center">
                            Exibição de todos ${tipo}
                        </div>
                        <div class="card-body" >
                            <div class="row" id="cardBodyExibicaoCategorias"></div>
                        </div>
                    </div>
                </div>
            </div>

            
        `
    }
}

// 10. CONFIGURAR COR DE NOTA ESTABELECIMENTO
function configurarAvaliacaoEstabelecimento() {
    const avaliacao = document.getElementById('avaliacaoEstabelecimento');
    const inputNota = document.getElementById('inputNotaEstabelecimento');

    if (!avaliacao || !inputNota) return;

    const estrelas = avaliacao.querySelectorAll('.estrela');

    let notaSelecionada = Number(inputNota.value) || 0;

    function colorirEstrelas(nota) {
        estrelas.forEach(estrela => {
            const numeroEstrela = Number(estrela.dataset.nota);
            estrela.classList.toggle('text-warning', numeroEstrela <= nota);
        });
    }

    estrelas.forEach(estrela => {
        estrela.addEventListener('mouseenter', function () {
            colorirEstrelas(Number(this.dataset.nota));
        });

        estrela.addEventListener('click', function () {
            notaSelecionada = Number(this.dataset.nota);
            inputNota.value = notaSelecionada;

            colorirEstrelas(notaSelecionada);
        });
    });

    avaliacao.addEventListener('mouseleave', function () {
        colorirEstrelas(notaSelecionada);
    });

    colorirEstrelas(notaSelecionada);
}

function salvarCadastro(tipo) {
    if (tipo === 'cadastroCategoria') {
        const idCategoria = document.getElementById('inputIDCadastroCategoria').value;
        const nomeCategoria = document.getElementById('inputNOMECadastroCategoria').value.trim();

        if (idCategoria === '' || nomeCategoria === '') {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        const categoriaExistente = arrayCategorias.some(categoria =>
            categoria.nome.toLowerCase() === nomeCategoria.toLowerCase()
        );

        if (categoriaExistente) {
            alert('Categoria já foi cadastrada anteriormente. Tente um cadastro diferente.');
            return;
        }

        const novoCadastro = new Categoria(idCategoria, nomeCategoria);

        arrayCategorias.push(novoCadastro);
        localStorage.setItem('cadastroCategoria', JSON.stringify(arrayCategorias));
        alert('Categoria cadastrada com sucesso!');

        document.getElementById('inputNOMECadastroCategoria').value = '';
        geraId('CTG', arrayCategorias, 'inputIDCadastroCategoria')
        ordenaArray(arrayCategorias)
        popularExibicao('categoria', 'cardBodyExibicaoCategorias', arrayCategorias)
    }
}

function popularExibicao(escolha, idCardExibicao, nomeArray) {
    const campoExibicaoCadastro = document.getElementById(idCardExibicao);

    if (!campoExibicaoCadastro) {
        console.error(`Elemento "${idCardExibicao}" não encontrado.`);
        return;
    }

    campoExibicaoCadastro.innerHTML = '';

    if (nomeArray.length > 0) {
        nomeArray.forEach(item => {
            campoExibicaoCadastro.insertAdjacentHTML('beforeend', `
                <div class="col-auto mb-3 m-auto">
                    <div class="input-group">
                        <input type="text" class="form-control" value="${item.nome}" disabled>
                        <button type="button" class="btn btn-success btn-sm input-group-text" title="Salvar">
                            <i class="fa fa-save"></i>
                        </button>

                        <button type="button" class="btn btn-primary btn-sm input-group-text" title="Editar">
                            <i class="fa fa-edit"></i>
                        </button>

                        <button type="button" class="btn btn-danger btn-sm input-group-text" title="Excluir">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </div>
            `);
        });
    } else {
        campoExibicaoCadastro.innerHTML = `
            <div class="alert alert-danger">
                <span class="uppercase tamanho09 fw-bold text-center">
                    Nenhum(a) ${escolha} cadastrado(a).
                </span>
            </div>
        `;
    }
}

function popularSelect(idSelect, nomeArray) {
    const selectExibicao = document.getElementById(idSelect);
    selectExibicao.innerHTML = '';

    if (nomeArray.length <= 0) {
        console.log('Nenhum item cadastrado para o array informado.');
        return;
    }

    nomeArray.forEach(item => {
        const optionSelect = document.createElement('option');

        optionSelect.value = item.nome;
        optionSelect.innerText = item.nome;

        selectExibicao.appendChild(optionSelect);
    });
}

function calculaValorUnitario() {
    const campoInputQtdKitProduto = document.getElementById('inputQtdKitProduto');
    const campoinputVolumeProduto = document.getElementById('inputVolumeProduto');
    const campoInputValorEmbalagemProduto = document.getElementById('inputValorEmbalagemProduto');
    const campoInputValorUnitarioKitProduto = document.getElementById('inputValorUnitarioKitProduto');
    const campoinputValorUnitarioPesoProduto = document.getElementById('inputValorUnitarioPesoProduto');

    const qtdKit = Number(campoInputQtdKitProduto.value);
    const valorEmbalagem = Number(campoInputValorEmbalagemProduto.value);
    const volumePeso = Number(campoinputVolumeProduto.value);

    if (campoInputQtdKitProduto.value.trim() === '' || qtdKit <= 0 ||
        campoInputValorEmbalagemProduto.value.trim() === '' || valorEmbalagem < 0) {
        campoInputValorUnitarioKitProduto.value = '';
        return;
    }

    const totalPrecoUnitarioKit = valorEmbalagem / qtdKit;
    const totalPrecoPeso = valorEmbalagem / (volumePeso * qtdKit)

    campoInputValorUnitarioKitProduto.value = totalPrecoUnitarioKit.toFixed(2);
    campoinputValorUnitarioPesoProduto.value = totalPrecoPeso.toFixed(5)
}


let fotoProduto = '';

function abrirCameraProduto() {
    const inputFoto = document.getElementById('inputFotoProduto');

    if (!inputFoto) {
        console.error('Campo inputFotoProduto não encontrado.');
        return;
    }

    // Permitir selecionar novamente a mesma imagem.
    inputFoto.value = '';

    // Configurar o evento de seleção.
    inputFoto.onchange = function () {
        carregarFotoProduto(this);
    };

    // Abrir o seletor de imagens.
    inputFoto.click();
}

function carregarFotoProduto(input) {
    const arquivo = input.files[0];

    const preview = document.getElementById('previewFoto');
    const placeholder = document.getElementById('placeholderFoto');
    const video = document.getElementById('videoCameraProduto');

    if (!arquivo) {
        return;
    }

    if (!arquivo.type.startsWith('image/')) {
        alert('Selecione um arquivo de imagem válido.');
        input.value = '';
        return;
    }

    const leitor = new FileReader();

    leitor.onload = function (evento) {
        // Armazenar a imagem em Base64.
        fotoProduto = evento.target.result;

        // Atualizar a pré-visualização.
        if (preview) {
            preview.src = fotoProduto;
            preview.style.display = 'block';
        }

        // Ocultar a mensagem de imagem ausente.
        if (placeholder) {
            placeholder.classList.add('d-none');
            placeholder.style.display = 'none';
        }

        // Ocultar a câmera, caso esteja aberta.
        if (video) {
            video.style.display = 'none';
        }

        console.log('Imagem carregada com sucesso.');
    };

    leitor.onerror = function () {
        console.error('Erro ao carregar a imagem.');
        alert('Não foi possível carregar a imagem selecionada.');
    };

    leitor.readAsDataURL(arquivo);
}

let leitorCodigoBarras = null;
let controlesLeitorCodigoBarras = null;
let modalCodigoBarras = null;

async function abrirLeitorCodigoBarras() {
    const video = document.getElementById('videoLeitorCodigoBarras');
    const status = document.getElementById('statusLeitorCodigoBarras');
    const campoCodigo = document.getElementById('inputCodigoBarrasProduto');

    if (!video || !status || !campoCodigo) {
        console.error('Elementos do leitor de código de barras não encontrados.');
        return;
    }

    if (!window.ZXingBrowser) {
        alert('A biblioteca de leitura não foi carregada. Verifique a conexão com a internet.');
        return;
    }

    try {
        modalCodigoBarras = bootstrap.Modal.getOrCreateInstance(
            document.getElementById('modalLeitorCodigoBarras')
        );

        modalCodigoBarras.show();

        status.textContent = 'Iniciando câmera...';

        leitorCodigoBarras = new ZXingBrowser.BrowserMultiFormatReader();

        controlesLeitorCodigoBarras =
            await leitorCodigoBarras.decodeFromConstraints(
                {
                    video: {
                        facingMode: { ideal: 'environment' }
                    },
                    audio: false
                },
                video,
                (resultado, erro, controles) => {
                    if (resultado) {
                        // Preencher o campo com o código lido.
                        campoCodigo.value = resultado.getText();

                        // Disparar evento para outros códigos que escutem alterações.
                        campoCodigo.dispatchEvent(
                            new Event('input', { bubbles: true })
                        );

                        campoCodigo.dispatchEvent(
                            new Event('change', { bubbles: true })
                        );

                        // Encerrar a câmera.
                        fecharLeitorCodigoBarras();

                        // Fechar o modal automaticamente.
                        if (modalCodigoBarras) {
                            modalCodigoBarras.hide();
                        }
                    }
                }
            );

        status.textContent =
            'Posicione o código de barras diante da câmera.';

    } catch (erro) {
        console.error('Erro ao abrir o leitor:', erro);

        status.textContent =
            'Não foi possível acessar a câmera. Verifique as permissões do navegador.';

        fecharLeitorCodigoBarras();
    }
}

function fecharLeitorCodigoBarras() {
    if (controlesLeitorCodigoBarras) {
        controlesLeitorCodigoBarras.stop();
        controlesLeitorCodigoBarras = null;
    }

    if (leitorCodigoBarras) {
        leitorCodigoBarras = null;
    }

    const video = document.getElementById('videoLeitorCodigoBarras');

    if (video) {
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }

        video.pause();
    }
}

window.onload = () => {
    ordenaArray(arrayCategorias);
    document.getElementById('btnProdutos').click();
    calculaValorUnitario();
};