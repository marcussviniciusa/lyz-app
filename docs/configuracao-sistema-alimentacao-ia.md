# Configuração do Sistema de Alimentação da IA - Lyz Platform

Este guia ensina como configurar o Sistema de Alimentação da IA na plataforma Lyz, incluindo o upload, armazenamento, extração de texto e indexação de materiais educativos para uso pelos agentes de IA.

## Sumário

1. [Requisitos](#1-requisitos)
2. [Configuração do MinIO](#2-configuração-do-minio)
3. [Configuração dos Extratores de Texto](#3-configuração-dos-extratores-de-texto)
4. [Configuração do Serviço de Indexação](#4-configuração-do-serviço-de-indexação)
5. [Testando o Sistema](#5-testando-o-sistema)
6. [Solução de Problemas](#6-solução-de-problemas)
7. [Integração com Agentes de IA](#7-integração-com-agentes-de-ia)

## 1. Requisitos

Antes de começar, você precisa ter instalado:

- **Node.js** (versão 16+)
- **MongoDB** (versão 4.4+)
- **MinIO** (versão 2023.0.0+) - para armazenamento de objetos
- Dependências para extração de texto:
  - **poppler-utils** (para processamento de PDFs)
  - **LibreOffice** (para processamento de documentos Office)

### Instalação das Dependências do Sistema

**Ubuntu/Debian**:
```bash
# Instalar poppler-utils para processamento de PDFs
sudo apt-get update
sudo apt-get install -y poppler-utils

# Instalar LibreOffice para processamento de documentos Office
sudo apt-get install -y libreoffice-common libreoffice-writer
```

**MacOS**:
```bash
# Usando Homebrew
brew install poppler
brew install --cask libreoffice
```

## 2. Configuração do MinIO

### 2.1 Instalação do MinIO

O MinIO é utilizado para armazenar os materiais educativos. Você pode executá-lo como um contêiner Docker ou instalá-lo diretamente.

**Usando Docker**:
```bash
docker run -p 9000:9000 -p 9001:9001 --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v /mnt/data:/data \
  minio/minio server /data --console-address ":9001"
```

### 2.2 Configuração das Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env` no diretório raiz do backend:

```
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=lyz-documents
MINIO_MATERIALS_BUCKET=lyz-materials
MINIO_REGION=us-east-1
```

### 2.3 Verificação da Configuração

Para verificar se a configuração do MinIO está correta, execute o seguinte comando no terminal:

```bash
# No diretório do backend
node -e "require('./src/config/minio').initBucket().then(() => console.log('MinIO configurado com sucesso!'))"
```

Se tudo estiver correto, você verá a mensagem "MinIO configurado com sucesso!". Esta etapa vai criar automaticamente os buckets necessários se eles não existirem.

## 3. Configuração dos Extratores de Texto

Os extratores de texto são responsáveis por extrair o conteúdo textual dos materiais educativos (PDFs, documentos Office, etc.) para posterior indexação e uso pela IA.

### 3.1 Verificação da Instalação dos Requisitos

Certifique-se de que as ferramentas necessárias estão instaladas e acessíveis:

```bash
# Verificar se o pdftotext está instalado
pdftotext -v

# Verificar se o LibreOffice está instalado
libreoffice --version
```

Se algum comando falhar, revise a seção de requisitos para instalar as dependências faltantes.

### 3.2 Configuração Personalizada (Opcional)

Se você precisar personalizar os extratores de texto, como adicionar suporte para novos formatos ou modificar o comportamento existente, edite o arquivo:

```
lyz-app/backend/src/services/storage/textExtractorService.ts
```

O sistema usa uma abordagem de classes extensíveis que facilita adicionar suporte para novos tipos de arquivo:

```typescript
// Exemplo de implementação de um novo extrator
class CustomFormatExtractor extends TextExtractor {
  supportedTypes = ['.custom', '.customformat'];
  
  async extract(filePath: string): Promise<ExtractedTextResult> {
    // Implementação da extração para o formato personalizado
    // ...
    return {
      textContent: extractedText,
      metadata: { /* metadados relevantes */ }
    };
  }
}

// Adicionar o novo extrator ao gerenciador
// No construtor da classe TextExtractorManager:
this.extractors = [
  new TextFileExtractor(),
  new PdfExtractor(),
  new OfficeExtractor(),
  new CustomFormatExtractor() // Novo extrator
];
```

## 4. Configuração do Serviço de Indexação

O serviço de indexação divide os textos extraídos em chunks menores para processamento eficiente pela IA e mantém o rastreamento de metadados relevantes.

### 4.1 Configuração do Tamanho dos Chunks

O tamanho padrão dos chunks é de 1000 caracteres com uma sobreposição de 200 caracteres. Se necessário, você pode ajustar esses valores no arquivo:

```
lyz-app/backend/src/services/storage/indexingService.ts
```

Procure pelas constantes:
```typescript
private readonly chunkSize = 1000; // Tamanho alvo para cada chunk
private readonly chunkOverlap = 200; // Sobreposição entre chunks
```

Valores maiores de `chunkSize` resultam em menos chunks, mas cada um contém mais contexto. Valores maiores de `chunkOverlap` melhoram a continuidade entre chunks, mas aumentam o armazenamento necessário.

### 4.2 Configuração da Indexação Automática (Opcional)

Por padrão, a indexação dos materiais é iniciada automaticamente após o upload. Se desejar desabilitar este comportamento e indexar manualmente, modifique o controlador em:

```
lyz-app/backend/src/controllers/materialController.ts
```

Na função `uploadMaterial`, comente ou remova as seguintes linhas:

```typescript
// Iniciar processamento assíncrono
indexingService.processMaterial(material._id.toString())
  .catch(error => console.error(`Erro ao processar material ${material._id}:`, error));
```

## 5. Testando o Sistema

Depois de configurar todos os componentes, você pode testar o sistema:

### 5.1 Iniciar o Servidor Backend

```bash
# No diretório do backend
npm run dev
```

### 5.2 Upload de um Material de Teste

Você pode usar a API REST ou a interface web para fazer upload de um material educativo.

**Usando curl para teste rápido**:
```bash
curl -X POST http://localhost:5000/api/materials/upload \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "file=@/caminho/para/seu/documento.pdf" \
  -F "title=Documento de Teste" \
  -F "description=Descrição do documento" \
  -F "category=academic_paper" \
  -F "author=Autor Teste" \
  -F "tags=[\"saúde\", \"nutrição\"]"
```

**Usando a interface web**:
1. Acesse o dashboard da plataforma Lyz
2. Navegue até a seção "Materiais Educativos"
3. Clique em "Adicionar Material"
4. Preencha o formulário e faça upload do arquivo

### 5.3 Verificar Status do Processamento

Você pode verificar o status do processamento do material acessando:

```
GET http://localhost:5000/api/materials/:id
```

O campo `processingStatus` indicará o estado atual:
- `pending`: Material ainda não foi processado
- `processing`: Extração e indexação em andamento
- `indexed`: Material processado com sucesso
- `failed`: Ocorreu um erro durante o processamento

## 6. Solução de Problemas

### 6.1 Problemas com Extração de Texto

Se encontrar problemas com a extração de texto:

1. Verifique se todas as dependências estão instaladas corretamente.
2. Verifique os logs do servidor para mensagens de erro específicas.
3. Tente reprocessar o material manualmente através da API:
   ```
   POST http://localhost:5000/api/materials/:id/reprocess
   ```
4. Verifique se o formato do arquivo é suportado pelos extratores.
5. Para PDFs complexos ou protegidos, pode ser necessário usar ferramentas adicionais.

### 6.2 Problemas com Armazenamento no MinIO

Se houver problemas com o armazenamento:

1. Verifique se o MinIO está em execução e acessível:
   ```bash
   curl -I http://localhost:9000
   ```
2. Confirme se as credenciais no arquivo `.env` estão corretas.
3. Verifique se os buckets foram criados corretamente:
   ```bash
   mc config host add myminio http://localhost:9000 minioadmin minioadmin
   mc ls myminio
   ```
4. Verifique permissões de escrita no diretório de dados do MinIO.

## 7. Integração com Agentes de IA

Para utilizar o conteúdo dos materiais educativos nos agentes de IA:

### 7.1 Pesquisa de Materiais Relevantes

O sistema inclui uma API para pesquisar materiais educativos com base em consulta de texto:

```typescript
// Exemplo de código para pesquisar materiais
import { materialAPI } from '@/lib/api';

const searchMaterials = async (query: string, categories?: string[], tags?: string[]) => {
  try {
    const response = await materialAPI.searchMaterials(query, categories, tags);
    return response.data.results;
  } catch (error) {
    console.error("Erro ao buscar materiais:", error);
    return [];
  }
};
```

### 7.2 Recuperação de Chunks para Uso no Contexto da IA

Para enriquecer o contexto dos agentes de IA com conhecimento específico:

```typescript
// Exemplo de código para obter chunks de um material
import { materialAPI } from '@/lib/api';

const getMaterialChunks = async (materialId: string) => {
  try {
    const response = await materialAPI.getMaterialChunks(materialId);
    return response.data.chunks;
  } catch (error) {
    console.error("Erro ao obter chunks do material:", error);
    return [];
  }
};

// Exemplo de uso com um agente de IA
const enrichAIContext = async (query: string, aiContext: any) => {
  // Buscar materiais relevantes
  const materials = await searchMaterials(query);
  
  if (materials.length > 0) {
    // Obter chunks do primeiro material encontrado
    const chunks = await getMaterialChunks(materials[0].id);
    
    // Adicionar chunks relevantes ao contexto do agente
    const contextWithMaterials = {
      ...aiContext,
      additionalKnowledge: chunks.map(chunk => chunk.text).join("\n\n")
    };
    
    return contextWithMaterials;
  }
  
  return aiContext;
};
```

### 7.3 Integração com os Agentes Especializados

Para integrar materiais educativos com os agentes especializados já implementados, modifique o arquivo `aiAgentService.ts`:

```typescript
// No método analyze do ExamAnalysisAgent
async analyze(examResults: string, query?: string): Promise<string> {
  try {
    // Buscar materiais relevantes para exames
    const materials = await materialAPI.searchMaterials(
      "análise de exames laboratoriais " + query,
      ["academic_paper", "clinical_guideline"]
    );
    
    let additionalContext = "";
    
    if (materials.length > 0) {
      const chunks = await materialAPI.getMaterialChunks(materials[0].id);
      additionalContext = chunks
        .map(chunk => chunk.text)
        .join("\n\n");
    }
    
    // Adicionar o conhecimento ao contexto do agente
    this.context.additionalKnowledge = additionalContext;
    
    // Prosseguir com a análise...
    // ...
  }
}
```

---

## Conclusão

Com esta configuração, seu sistema de alimentação da IA estará pronto para processar e indexar materiais educativos. A IA poderá usar este conhecimento para fornecer análises e recomendações mais precisas e fundamentadas, enriquecendo os planos de saúde gerados na plataforma Lyz.

A estrutura modular permite expandir facilmente o sistema para suportar novos tipos de arquivos, métodos de extração mais sofisticados, ou estratégias de indexação adaptadas para casos de uso específicos.

Para obter mais detalhes sobre a implementação técnica, consulte os arquivos:
- `minioService.ts` - para armazenamento de objetos
- `textExtractorService.ts` - para extração de texto
- `indexingService.ts` - para indexação e chunking
- `materialController.ts` - para APIs de gerenciamento de materiais
- `Material.ts` - para o modelo de dados

Para dúvidas adicionais, entre em contato com a equipe de desenvolvimento.
