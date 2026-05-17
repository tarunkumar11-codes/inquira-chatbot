from dotenv import load_dotenv
load_dotenv()
import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_classic.chains import RetrievalQA
import tempfile

app = Flask(__name__)
CORS(app)

qa_chain = None
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


@app.route('/upload', methods=['POST'])
def upload():
    global qa_chain

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith('.pdf'):
        return jsonify({"error": "Only PDF files are allowed"}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        loader = PyPDFLoader(tmp_path)
        documents = loader.load()

        text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        texts = text_splitter.split_documents(documents)

        db = Chroma.from_documents(texts, embeddings)

        llm = ChatGroq(model="llama-3.3-70b-versatile")
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=db.as_retriever()
        )

        return jsonify({
            "message": "PDF uploaded and processed successfully",
            "pages": len(documents),
            "chunks": len(texts)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        os.unlink(tmp_path)


@app.route('/chat', methods=['POST'])
def chat():
    global qa_chain

    if qa_chain is None:
        return jsonify({"error": "Please upload a PDF first"}), 400

    data = request.get_json()

    if not data or 'question' not in data:
        return jsonify({"error": "No question provided"}), 400

    question = data['question'].strip()

    if not question:
        return jsonify({"error": "Question cannot be empty"}), 400

    try:
        result = qa_chain.invoke({"query": question})
        return jsonify({"answer": result["result"]})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "Server is running"})


if __name__ == '__main__':
    app.run(debug=True, port=5000)