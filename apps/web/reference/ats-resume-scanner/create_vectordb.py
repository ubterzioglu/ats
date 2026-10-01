from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import os

print("=" * 60)
print("Step 1: Loading documents...")
print("=" * 60)

# Load documents
loader = DirectoryLoader('data/', glob="**/*.txt", loader_cls=TextLoader)
documents = loader.load()
print(f"✓ Loaded {len(documents)} documents\n")

print("=" * 60)
print("Step 2: Splitting documents into chunks...")
print("=" * 60)

# Split documents
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    length_function=len,
)
chunks = text_splitter.split_documents(documents)
print(f"✓ Created {len(chunks)} text chunks\n")

print("=" * 60)
print("Step 3: Creating embeddings model...")
print("=" * 60)
print("Downloading model 'all-MiniLM-L6-v2' (first time only)...")

# Create embeddings model
embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'},
)
print("✓ Embeddings model loaded\n")

print("=" * 60)
print("Step 4: Creating ChromaDB vector database...")
print("=" * 60)

# Create vector database
vectordb = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)
print(f"✓ Vector database created with {len(chunks)} chunks")
print(f"✓ Database saved to './chroma_db' directory\n")

print("=" * 60)
print("Step 5: Testing semantic search...")
print("=" * 60)

# Test query
test_query = "What skills are required?"
print(f"Query: '{test_query}'\n")

results = vectordb.similarity_search(test_query, k=2)

print("Top 2 relevant chunks:")
for i, doc in enumerate(results):
    print(f"\n--- Result {i+1} ---")
    print(f"Content: {doc.page_content[:300]}...")
    print(f"Source: {doc.metadata['source']}")

print("\n" + "=" * 60)
print("✓ Vector database setup complete!")
print("=" * 60)
