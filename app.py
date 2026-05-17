from dotenv import load_dotenv
load_dotenv()
import os

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_classic.chains import RetrievalQA


def load_pdf(embeddings):
    while True:
        print("\nPlease enter the path to your PDF file.")
        print("You can also drag and drop the file into the terminal.\n")

        pdf_path = input("PDF path: ").strip().strip('"').strip("'")

        if not os.path.exists(pdf_path):
            print("File not found. Please check the path and try again.")
            continue

        if not pdf_path.endswith('.pdf'):
            print("Only PDF files are supported. Please try again.")
            continue

        print("\nLoading PDF, please wait...")

        loader = PyPDFLoader(pdf_path)
        documents = loader.load()

        text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        texts = text_splitter.split_documents(documents)

        print(f"Loaded {len(documents)} pages and split into {len(texts)} chunks.")
        print("Creating embeddings, please wait...")

        db = Chroma.from_documents(texts, embeddings)

        print("Chatbot is ready.\n")

        return db


def main():
    print("Welcome to Inquira Chatbot!")

    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    llm = ChatGroq(model="llama-3.3-70b-versatile")

    db = load_pdf(embeddings)

    qa = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=db.as_retriever()
    )

    print("You can now ask anything about the document.")
    print("Type 'new' to load a different PDF.")
    print("Type 'exit' to quit.\n")

    while True:
        query = input("You: ").strip()

        if not query:
            continue

        if query.lower() == 'exit':
            print("Thank you for using Inquira. Goodbye!")
            break

        if query.lower() == 'new':
            db = load_pdf(embeddings)
            qa = RetrievalQA.from_chain_type(
                llm=llm,
                retriever=db.as_retriever()
            )
            print("New PDF loaded. You can now ask your questions.\n")
            continue

        result = qa.invoke({"query": query})
        print(f"\nBot: {result['result']}\n")


if __name__ == "__main__":
    main()