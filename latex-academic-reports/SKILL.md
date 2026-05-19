---
name: latex-academic-reports
description: Generate academic reports, papers, and technical documentation using LaTeX. Use when the user asks to create research papers, lab reports, theses, technical documentation, IEEE-style papers, or any academic document requiring professional typesetting. Produces publication-quality PDFs with proper formatting, citations, figures, tables, and mathematical notation. Ideal for Computer Science, Engineering, and scientific documents.
license: MIT
---

This skill guides the creation of professional academic documents using LaTeX, producing high-quality PDFs with proper formatting, citations, and technical content presentation.

The user requests an academic document (lab report, research paper, thesis, technical report) or asks to convert existing content to LaTeX. They may specify the document type, citation style, or formatting requirements.

## Core Principle

**PROFESSIONAL TYPESETTING WITH ACADEMIC STANDARDS**

LaTeX provides:

- Precise control over document structure
- Beautiful mathematical notation
- Automated bibliography management
- Consistent formatting across documents
- Publication-quality output

## Information Gathering Protocol

**BEFORE generating ANY LaTeX document, gather required information from the user.**

### Step 1: Detect Document Type

Ask which type of document:

- Lab Report (Práctica de laboratorio)
- Research Paper (Artículo de investigación)
- Technical Report (Reporte técnico)
- Thesis/Dissertation (Tesis)
- IEEE Conference Paper
- Other academic document

### Step 2: Gather Front Matter Information

**Use ask_user_input_v0 to collect**:

#### For University Reports (Lab, Technical Reports):

- **Student Information**:
  - Full name
  - Student ID (Matrícula)
  - Email
- **Course Information**:
  - Course name (Nombre de la materia)
  - Professor/Instructor name
  - University name
  - Faculty/School name
  - Academic program
- **Document Information**:
  - Document title
  - Subtitle (if applicable)
  - Practice/Lab number (if applicable)
  - Date (use \today or specific date)

#### For Research Papers:

- **Authors**: Names and affiliations
- **Paper title** and subtitle
- **Institution(s)**
- **Keywords**
- **Abstract** (or generate later)

#### For IEEE Papers:

- **Authors**: Names, departments, institutions, emails
- **Paper title**
- **Keywords**
- **Conference name** (if applicable)

### Step 3: Gather Content Requirements

Ask about:

- **Language**: Spanish or English
- **Citation style**: IEEE, APA, Harvard (default: IEEE)
- **Include**: Code listings? Mathematical notation? Figures?
- **Special requirements**: Company logo, specific formatting

### Step 4: Generate Document

After collecting information, generate the complete LaTeX document with all data populated.

## Elicitation Examples

### Example 1: Lab Report Request

**User**: "Necesito crear un reporte de laboratorio en LaTeX"

**Assistant response**:

```

Perfecto, voy a ayudarte a crear tu reporte de laboratorio. Necesito algunos datos para la portada y configuración:

[Calls ask_user_input_v0 with:]

- Question 1: "Tipo de documento"
  Options: ["Práctica de laboratorio", "Reporte técnico", "Artículo de investigación"]
- Question 2: "Idioma del documento"
  Options: ["Español", "English"]
- Question 3: "¿Incluirá código de programación?"
  Options: ["Sí, Python", "Sí, Java", "Sí, C++", "No"]

```

**After user selects, ask for details**:

```

[Calls ask_user_input_v0 with text inputs or follow-up questions to gather:]

- Nombre completo
- Matrícula
- Universidad
- Materia
- Título del reporte
- Número de práctica (si aplica)

```

### Example 2: When User Provides Partial Info

**User**: "Haz un reporte de la práctica 3 de Algoritmos"

**Assistant response**:

```

Entendido, voy a crear el reporte de la Práctica 3 para Algoritmos. Necesito algunos datos adicionales:

[Calls ask_user_input_v0 to gather missing info:]

- Tu nombre completo
- Tu matrícula
- Nombre de tu universidad
- Título específico de la práctica 3

```

## Document Templates with Placeholders

### Template 1: Lab Report (Computer Science)

```latex
\documentclass[12pt,letterpaper]{article}

\usepackage[utf8]{inputenc}
\usepackage[spanish]{babel}
\usepackage[margin=2.5cm]{geometry}
\usepackage{graphicx}
\usepackage{float}
\usepackage{booktabs}
\usepackage{listings}
\usepackage{xcolor}
\usepackage{amsmath}
\usepackage{hyperref}
\usepackage{cite}

% Code listing style
\lstset{
    language=Python,
    basicstyle=\ttfamily\footnotesize,
    keywordstyle=\color{blue},
    commentstyle=\color{green!60!black},
    stringstyle=\color{red},
    numbers=left,
    numberstyle=\tiny\color{gray},
    stepnumber=1,
    numbersep=5pt,
    backgroundcolor=\color{gray!10},
    frame=single,
    breaklines=true,
    captionpos=b
}

\title{Práctica [NUMERO]: [TITULO]\\
\large [MATERIA]}
\author{
    [NOMBRE_ALUMNO]\\
    \textit{Matrícula: [MATRICULA]}\\
    \textit{[UNIVERSIDAD]}\\
    \textit{[FACULTAD]}\\
    \textit{[EMAIL]}
}
\date{\today}

\begin{document}

\maketitle

% Optional: Add logo
% \begin{figure}[t]
% \centering
% \includegraphics[width=0.2\textwidth]{logo_universidad.png}
% \end{figure}

\tableofcontents
\newpage

\section{Introducción}
[Escribe aquí la introducción: contexto del problema, objetivos de la práctica, alcance]

\subsection{Objetivo General}
[Objetivo principal de la práctica]

\subsection{Objetivos Específicos}
\begin{itemize}
    \item [Objetivo 1]
    \item [Objetivo 2]
    \item [Objetivo 3]
\end{itemize}

\section{Marco Teórico}
[Conceptos fundamentales necesarios para entender la práctica]

\subsection{[Concepto 1]}
[Explicación con ecuaciones si es necesario]

Por ejemplo, la complejidad temporal se define como:
\begin{equation}
    T(n) = O(f(n))
    \label{eq:complejidad}
\end{equation}

donde $n$ es el tamaño de la entrada.

\section{Desarrollo}

\subsection{Metodología}
[Pasos seguidos para resolver el problema]

\begin{enumerate}
    \item [Paso 1]
    \item [Paso 2]
    \item [Paso 3]
\end{enumerate}

\subsection{Implementación}

El código principal se muestra a continuación:

\begin{lstlisting}[caption={Implementación del algoritmo},label={lst:main}]
def bubble_sort(arr):
    """
    Ordena un arreglo usando bubble sort.
    Complejidad: O(n^2)
    """
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr
\end{lstlisting}

\subsection{Pruebas y Resultados}

Se realizaron pruebas con diferentes tamaños de entrada. Los resultados se muestran en la Tabla~\ref{tab:resultados}.

\begin{table}[H]
\centering
\caption{Tiempos de ejecución por tamaño de entrada}
\label{tab:resultados}
\begin{tabular}{@{}ccc@{}}
\toprule
Tamaño (n) & Tiempo (ms) & Complejidad Teórica \\ \midrule
100        & 2.3         & $O(n^2)$            \\
500        & 58.1        & $O(n^2)$            \\
1000       & 231.4       & $O(n^2)$            \\ \bottomrule
\end{tabular}
\end{table}

La Figura~\ref{fig:grafica} muestra la relación entre el tamaño de entrada y el tiempo de ejecución.

\begin{figure}[H]
    \centering
    \includegraphics[width=0.7\textwidth]{grafica_tiempos.png}
    \caption{Tiempo de ejecución vs. tamaño de entrada}
    \label{fig:grafica}
\end{figure}

\section{Análisis de Resultados}
[Interpretación de los resultados, comparación con teoría, discusión]

Los resultados muestran que el algoritmo sigue la complejidad esperada de $O(n^2)$, como se observa en la ecuación~\eqref{eq:complejidad} y el Listado~\ref{lst:main}.

\section{Conclusiones}
[Conclusiones derivadas del trabajo, objetivos cumplidos, aprendizajes]

\section{Referencias}
\bibliographystyle{IEEEtran}
\bibliography{referencias}

% Si no usas BibTeX, puedes usar:
% \begin{thebibliography}{99}
% \bibitem{knuth}
% D. E. Knuth, \textit{The Art of Computer Programming}, vol. 1.
% Addison-Wesley, 1997.
% \end{thebibliography}

\end{document}
```

### Template 2: Technical Report with Extended Title Page

```latex
\documentclass[12pt,letterpaper]{report}

\usepackage[utf8]{inputenc}
\usepackage[spanish]{babel}
\usepackage[margin=2.5cm]{geometry}
\usepackage{graphicx}
\usepackage{float}
\usepackage{booktabs}
\usepackage{listings}
\usepackage{xcolor}
\usepackage{amsmath}
\usepackage{hyperref}
\usepackage{cite}
\usepackage{fancyhdr}
\usepackage{setspace}

\onehalfspacing

\pagestyle{fancy}
\fancyhf{}
\rhead{\thepage}
\lhead{\leftmark}

\lstset{
    basicstyle=\ttfamily\footnotesize,
    keywordstyle=\color{blue},
    commentstyle=\color{green!60!black},
    stringstyle=\color{red},
    numbers=left,
    numberstyle=\tiny\color{gray},
    frame=single,
    breaklines=true
}

\begin{document}

% Custom Title Page
\begin{titlepage}
    \centering

    % University Logo (optional)
    % \includegraphics[width=0.3\textwidth]{logo_universidad.png}\\[1cm]

    {\Large\bfseries [UNIVERSIDAD]\par}
    \vspace{0.5cm}
    {\large [FACULTAD]\par}
    \vspace{0.5cm}
    {\large [PROGRAMA_ACADEMICO]\par}
    \vspace{2cm}

    {\LARGE\bfseries [TITULO_REPORTE]\par}
    \vspace{1cm}
    {\Large [SUBTITULO]\par}
    \vspace{2cm}

    {\large
    \textbf{Presenta:}\\
    [NOMBRE_ALUMNO]\\
    Matrícula: [MATRICULA]\\
    \vspace{1cm}

    \textbf{Materia:}\\
    [MATERIA]\\
    \vspace{1cm}

    \textbf{Profesor:}\\
    [NOMBRE_PROFESOR]\\
    \vspace{2cm}

    [CIUDAD], [ESTADO]\\
    \today
    }

\end{titlepage}

% Abstract/Resumen
\chapter*{Resumen}
\addcontentsline{toc}{chapter}{Resumen}
[Resumen ejecutivo del reporte: 200-300 palabras]

\textbf{Palabras clave:} [palabra1, palabra2, palabra3]

% Table of contents
\tableofcontents
\listoffigures
\listoftables
\lstlistoflistings

\chapter{Introducción}

\section{Contexto}
[Contexto del problema]

\section{Planteamiento del Problema}
[Descripción detallada del problema]

\section{Objetivos}

\subsection{Objetivo General}
[Objetivo principal]

\subsection{Objetivos Específicos}
\begin{enumerate}
    \item [Objetivo 1]
    \item [Objetivo 2]
    \item [Objetivo 3]
\end{enumerate}

\section{Justificación}
[Por qué es importante este trabajo]

\section{Alcance y Limitaciones}
[Qué incluye y qué no incluye el reporte]

\chapter{Marco Teórico}

\section{Fundamentos}
[Conceptos teóricos necesarios]

\section{Estado del Arte}
[Trabajos relacionados, tecnologías existentes]

\chapter{Metodología}

\section{Enfoque}
[Descripción del enfoque metodológico]

\section{Herramientas y Tecnologías}
[Herramientas utilizadas]

\section{Proceso de Desarrollo}
[Pasos seguidos]

\chapter{Desarrollo}

\section{Análisis}
[Análisis del problema]

\section{Diseño}
[Diseño de la solución]

\section{Implementación}
[Detalles de implementación]

\begin{lstlisting}[language=Python, caption={Ejemplo de implementación}, label={lst:ejemplo}]
def example_function(param):
    """
    Función de ejemplo.
    """
    result = process(param)
    return result
\end{lstlisting}

\chapter{Resultados}

\section{Pruebas Realizadas}
[Descripción de las pruebas]

\section{Análisis de Resultados}
[Interpretación de resultados]

\chapter{Conclusiones y Trabajo Futuro}

\section{Conclusiones}
[Conclusiones derivadas del trabajo]

\section{Trabajo Futuro}
[Posibles extensiones o mejoras]

\bibliographystyle{IEEEtran}
\bibliography{referencias}

\appendix
\chapter{Código Fuente Completo}
[Código completo si es necesario]

\chapter{Datos Adicionales}
[Tablas, gráficas, datos extras]

\end{document}
```

### Template 3: IEEE Conference Paper

```latex
\documentclass[conference]{IEEEtran}

\usepackage{cite}
\usepackage{amsmath,amssymb,amsfonts}
\usepackage{algorithmic}
\usepackage{graphicx}
\usepackage{textcomp}
\usepackage{xcolor}

\def\BibTeX{{\rm B\kern-.05em{\sc i\kern-.025em b}\kern-.08em
    T\kern-.1667em\lower.7ex\hbox{E}\kern-.125emX}}

\begin{document}

\title{[TITULO_PAPER]\\
{\footnotesize [SUBTITULO]}
}

\author{
\IEEEauthorblockN{[AUTOR1_NOMBRE]}
\IEEEauthorblockA{
\textit{[DEPARTAMENTO1]} \\
\textit{[INSTITUCION1]}\\
[CIUDAD1], [PAIS1] \\
[EMAIL1]
}
\and
\IEEEauthorblockN{[AUTOR2_NOMBRE]}
\IEEEauthorblockA{
\textit{[DEPARTAMENTO2]} \\
\textit{[INSTITUCION2]}\\
[CIUDAD2], [PAIS2] \\
[EMAIL2]
}
% Add more authors as needed
}

\maketitle

\begin{abstract}
[Abstract: 150-250 palabras resumiendo el paper. Debe incluir: problema, metodología, resultados principales, conclusión]
\end{abstract}

\begin{IEEEkeywords}
[keyword1, keyword2, keyword3, keyword4, keyword5]
\end{IEEEkeywords}

\section{Introduction}
[Introduction with problem statement, motivation, contributions]

The rest of this paper is organized as follows. Section~\ref{sec:related} reviews related work. Section~\ref{sec:method} describes our methodology. Section~\ref{sec:results} presents the results. Section~\ref{sec:conclusion} concludes the paper.

\section{Related Work}
\label{sec:related}
[Literature review, related work, comparison with existing approaches]

\section{Methodology}
\label{sec:method}
[Detailed description of the approach]

\subsection{Problem Formulation}

Let $G = (V, E)$ be a graph where:
\begin{equation}
    V = \{v_1, v_2, \ldots, v_n\}
\end{equation}

\subsection{Algorithm}

\begin{algorithmic}
\STATE Initialize $S \leftarrow \emptyset$
\FOR{each vertex $v \in V$}
    \STATE $S \leftarrow S \cup \{v\}$
\ENDFOR
\RETURN $S$
\end{algorithmic}

\section{Results}
\label{sec:results}
[Experimental setup, results, analysis]

\begin{table}[htbp]
\caption{Performance Comparison}
\begin{center}
\begin{tabular}{|c|c|c|}
\hline
\textbf{Method} & \textbf{Accuracy} & \textbf{Time (ms)} \\
\hline
Baseline & 85.3\% & 150 \\
Proposed & 92.1\% & 120 \\
\hline
\end{tabular}
\label{tab:comparison}
\end{center}
\end{table}

\begin{figure}[htbp]
\centerline{\includegraphics[width=0.5\textwidth]{figure1.png}}
\caption{Example figure.}
\label{fig:example}
\end{figure}

\section{Conclusion}
\label{sec:conclusion}
[Summary, contributions, future work]

\section*{Acknowledgment}
[Optional acknowledgments]

\begin{thebibliography}{00}
\bibitem{b1} G. Eason, B. Noble, and I. N. Sneddon, ``On certain integrals of Lipschitz-Hankel type involving products of Bessel functions,'' Phil. Trans. Roy. Soc. London, vol. A247, pp. 529--551, April 1955.
\bibitem{b2} J. Clerk Maxwell, A Treatise on Electricity and Magnetism, 3rd ed., vol. 2. Oxford: Clarendon, 1892, pp.68--73.
\end{thebibliography}

\end{document}
```

## Workflow

### Step-by-Step Process

1. **User requests LaTeX document**
   - "Necesito un reporte de laboratorio"
   - "Crea una práctica de Algoritmos"
   - "Genera un paper IEEE"

2. **Identify document type**
   - Use ask_user_input_v0 if not clear
   - Determine template to use

3. **Gather information**
   - Use ask_user_input_v0 for front matter
   - Collect: name, ID, university, course, title, etc.
   - Ask about language, code inclusion, special requirements

4. **Generate complete document**
   - Replace all [PLACEHOLDERS] with actual data
   - Include appropriate packages based on requirements
   - Add code listing configuration if needed

5. **Create supporting files**
   - Generate referencias.bib if citations needed
   - Create compilation instructions
   - Provide file structure recommendations

6. **Deliver artifacts**
   - Main .tex file with all data populated
   - referencias.bib (if applicable)
   - Compilation instructions
   - Folder structure recommendation

## Information Collection Examples

### Comprehensive Data Collection

```markdown
**For Lab Report**, collect:

1. Document Type & Language:
   - Tipo: Práctica de laboratorio
   - Idioma: Español / English
   - Incluye código: Sí (Python/Java/C++) / No

2. Student Information:
   - Nombre completo: [user input]
   - Matrícula: [user input]
   - Email: [user input]

3. University Information:
   - Universidad: [user input]
   - Facultad/Escuela: [user input]
   - Programa: [e.g., Ing. en Ciencias Computacionales]

4. Course Information:
   - Materia: [user input]
   - Profesor: [user input]

5. Document Information:
   - Número de práctica: [user input or N/A]
   - Título: [user input]
   - Fecha: \today / [specific date]

6. Content Requirements:
   - ¿Incluirá ecuaciones matemáticas? Sí/No
   - ¿Incluirá figuras/gráficas? Sí/No
   - ¿Incluirá tablas de resultados? Sí/No
   - ¿Necesita bibliografía? Sí/No
```

### Default Values and Smart Inference

```markdown
**Smart defaults**:

- If user says "práctica 3", infer: Número de práctica = 3
- If user says "de Algoritmos", infer: Materia = Algoritmos
- If code language mentioned, auto-configure listings
- Default to Spanish for Mexican universities
- Default to IEEE citation style for CS/Engineering
- Default to \today for date unless specified
```

## Bibliography Management with BibTeX

### Creating referencias.bib file

```bibtex
% Book
@book{knuth1997art,
  title={The Art of Computer Programming, Volume 1: Fundamental Algorithms},
  author={Knuth, Donald E},
  year={1997},
  publisher={Addison-Wesley},
  edition={3rd}
}

% Journal article
@article{dijkstra1959note,
  title={A note on two problems in connexion with graphs},
  author={Dijkstra, Edsger W},
  journal={Numerische mathematik},
  volume={1},
  number={1},
  pages={269--271},
  year={1959},
  publisher={Springer}
}

% Conference paper
@inproceedings{lecun1998mnist,
  title={MNIST handwritten digit database},
  author={LeCun, Yann},
  booktitle={Proceedings of the IEEE Conference on Computer Vision},
  year={1998}
}

% Website/Online
@misc{python2023,
  author = {{Python Software Foundation}},
  title = {Python Language Reference, version 3.11},
  year = {2023},
  url = {https://www.python.org},
  note = {Accedido: 2023-10-15}
}

% Technical report
@techreport{lamport1994latex,
  title={LATEX: a document preparation system: user's guide and reference manual},
  author={Lamport, Leslie},
  year={1994},
  institution={Addison-Wesley}
}

% Thesis
@phdthesis{shannon1940mathematical,
  title={A mathematical theory of communication},
  author={Shannon, Claude Elwood},
  year={1940},
  school={Massachusetts Institute of Technology}
}
```

### Using citations in text

```latex
% In your document:

% Single citation
According to Knuth~\cite{knuth1997art}, the algorithm...

% Multiple citations
Several studies~\cite{dijkstra1959note,lecun1998mnist} have shown...

% Citation with page number (IEEE style doesn't typically use this)
As stated in~\cite[p. 42]{knuth1997art}...

% At the end of document:
\bibliographystyle{IEEEtran}  % IEEE style
\bibliography{referencias}     % references.bib file (without .bib extension)
```

## Code Listings Configuration

### Advanced Listings Setup

```latex
\usepackage{listings}
\usepackage{xcolor}

% Define colors
\definecolor{codegreen}{rgb}{0,0.6,0}
\definecolor{codegray}{rgb}{0.5,0.5,0.5}
\definecolor{codepurple}{rgb}{0.58,0,0.82}
\definecolor{backcolour}{rgb}{0.95,0.95,0.92}

% Python style
\lstdefinestyle{python}{
    language=Python,
    backgroundcolor=\color{backcolour},
    commentstyle=\color{codegreen},
    keywordstyle=\color{magenta},
    numberstyle=\tiny\color{codegray},
    stringstyle=\color{codepurple},
    basicstyle=\ttfamily\footnotesize,
    breakatwhitespace=false,
    breaklines=true,
    captionpos=b,
    keepspaces=true,
    numbers=left,
    numbersep=5pt,
    showspaces=false,
    showstringspaces=false,
    showtabs=false,
    tabsize=4
}

% Java style
\lstdefinestyle{java}{
    language=Java,
    backgroundcolor=\color{backcolour},
    commentstyle=\color{codegreen},
    keywordstyle=\color{blue},
    numberstyle=\tiny\color{codegray},
    stringstyle=\color{codepurple},
    basicstyle=\ttfamily\footnotesize,
    breaklines=true,
    numbers=left,
    frame=single
}

% C++ style
\lstdefinestyle{cpp}{
    language=C++,
    backgroundcolor=\color{backcolour},
    commentstyle=\color{codegreen},
    keywordstyle=\color{blue},
    numberstyle=\tiny\color{codegray},
    stringstyle=\color{codepurple},
    basicstyle=\ttfamily\footnotesize,
    breaklines=true,
    numbers=left,
    frame=single
}

\lstset{style=python} % Set default style

% Usage:
\begin{lstlisting}[style=python, caption={Python example}]
def hello_world():
    print("Hello, world!")
\end{lstlisting}

\begin{lstlisting}[style=java, caption={Java example}]
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}
\end{lstlisting}
```

## Mathematical Notation

### Common Math Environments

```latex
% Inline math
The complexity is $O(n \log n)$ for this algorithm.

% Display equation (numbered)
\begin{equation}
    E = mc^2
    \label{eq:einstein}
\end{equation}

% Display equation (unnumbered)
\[
    \sum_{i=1}^{n} i = \frac{n(n+1)}{2}
\]

% Multiple aligned equations
\begin{align}
    f(x) &= x^2 + 2x + 1 \\
    &= (x+1)^2
\end{align}

% System of equations
\begin{equation}
    \begin{cases}
        x + y = 5 \\
        2x - y = 1
    \end{cases}
\end{equation}

% Matrix
\begin{equation}
    A = \begin{bmatrix}
        a_{11} & a_{12} \\
        a_{21} & a_{22}
    \end{bmatrix}
\end{equation}

% Theorem environment
\newtheorem{theorem}{Teorema}[section]
\newtheorem{lemma}[theorem]{Lema}
\newtheorem{definition}{Definición}[section]

\begin{theorem}
    Para todo $n > 1$, se cumple que $2^n > n$.
\end{theorem}

\begin{proof}
    Por inducción matemática...
\end{proof}
```

### Common Math Symbols

```latex
% Greek letters
$\alpha, \beta, \gamma, \delta, \epsilon, \lambda, \mu, \pi, \sigma, \omega$
$\Gamma, \Delta, \Theta, \Lambda, \Sigma, \Omega$

% Operators
$\sum_{i=1}^{n}$  % Sum
$\prod_{i=1}^{n}$ % Product
$\int_{a}^{b}$    % Integral
$\lim_{x \to \infty}$ % Limit

% Relations
$\leq, \geq, \neq, \approx, \equiv, \in, \subset, \subseteq$

% Logic
$\forall, \exists, \neg, \land, \lor, \implies, \iff$

% Sets
$\emptyset, \cup, \cap, \setminus, \mathbb{N}, \mathbb{Z}, \mathbb{R}$

% Arrows
$\to, \rightarrow, \leftarrow, \leftrightarrow, \Rightarrow, \Leftarrow$

% Fractions and roots
$\frac{a}{b}, \sqrt{x}, \sqrt[n]{x}$

% Accents
$\hat{x}, \bar{x}, \tilde{x}, \vec{x}$
```

## Figures and Tables

### Figure Best Practices

```latex
% Simple figure
\begin{figure}[H]
    \centering
    \includegraphics[width=0.8\textwidth]{imagen.png}
    \caption{Descripción de la figura}
    \label{fig:ejemplo}
\end{figure}

% Multiple subfigures
\usepackage{subcaption}

\begin{figure}[H]
    \centering
    \begin{subfigure}{0.45\textwidth}
        \centering
        \includegraphics[width=\textwidth]{imagen1.png}
        \caption{Primera imagen}
        \label{fig:sub1}
    \end{subfigure}
    \hfill
    \begin{subfigure}{0.45\textwidth}
        \centering
        \includegraphics[width=\textwidth]{imagen2.png}
        \caption{Segunda imagen}
        \label{fig:sub2}
    \end{subfigure}
    \caption{Comparación de resultados}
    \label{fig:comparacion}
\end{figure}

% Reference in text
Como se observa en la Figura~\ref{fig:ejemplo}...
```

### Table Best Practices

```latex
% Simple table
\begin{table}[H]
\centering
\caption{Resultados experimentales}
\label{tab:resultados}
\begin{tabular}{@{}lcc@{}}
\toprule
Algoritmo & Tiempo (ms) & Precisión (\%) \\ \midrule
A         & 150         & 92.3           \\
B         & 120         & 89.7           \\
C         & 180         & 94.1           \\ \bottomrule
\end{tabular}
\end{table}

% Table with multirow
\usepackage{multirow}

\begin{table}[H]
\centering
\caption{Comparación de métodos}
\begin{tabular}{@{}llcc@{}}
\toprule
\multirow{2}{*}{Método} & \multirow{2}{*}{Tipo} & \multicolumn{2}{c}{Métricas} \\ \cmidrule(l){3-4}
 &  & Precisión & Recall \\ \midrule
A & Supervisado & 0.92 & 0.88 \\
B & No supervisado & 0.85 & 0.82 \\ \bottomrule
\end{tabular}
\end{table}
```

## Compilation Workflow

### Standard Compilation (with BibTeX)

```bash
# Step 1: Compile LaTeX
pdflatex documento.tex

# Step 2: Generate bibliography
bibtex documento

# Step 3: Compile again (twice for references)
pdflatex documento.tex
pdflatex documento.tex

# Result: documento.pdf
```

### Using latexmk (Automated)

```bash
# Compile automatically (recommended)
latexmk -pdf documento.tex

# Compile with continuous preview
latexmk -pdf -pvc documento.tex

# Clean auxiliary files
latexmk -c

# Clean all generated files
latexmk -C
```

### Overleaf (Online)

```markdown
1. Go to https://www.overleaf.com
2. Create new project → Upload Project
3. Upload .tex file and images folder
4. Upload referencias.bib
5. Click "Recompile" (automatic in most cases)
6. Download PDF
```

## Common Packages Reference

### Essential Packages

```latex
% Language and encoding
\usepackage[utf8]{inputenc}        % UTF-8 encoding
\usepackage[spanish]{babel}         % Spanish language
\usepackage[T1]{fontenc}           % Font encoding

% Page layout
\usepackage[margin=2.5cm]{geometry} % Margins
\usepackage{fancyhdr}              % Headers/footers
\usepackage{setspace}              % Line spacing

% Graphics and colors
\usepackage{graphicx}              % Include images
\usepackage{xcolor}                % Colors
\usepackage{tikz}                  % Drawing diagrams
\usepackage{float}                 % Float positioning [H]

% Tables
\usepackage{booktabs}              % Professional tables
\usepackage{multirow}              % Multirow cells
\usepackage{longtable}             % Tables across pages
\usepackage{array}                 % Extended column formats

% Mathematics
\usepackage{amsmath}               % Advanced math
\usepackage{amssymb}               % Math symbols
\usepackage{amsthm}                % Theorem environments

% Code listings
\usepackage{listings}              % Code formatting
\usepackage{algorithm}             % Algorithm environment
\usepackage{algorithmic}           % Algorithm formatting

% References and links
\usepackage{hyperref}              % Hyperlinks
\usepackage{cite}                  % Citations
\usepackage{url}                   % URLs

% Other useful packages
\usepackage{enumitem}              % Customize lists
\usepackage{caption}               % Caption customization
\usepackage{subcaption}            % Subfigures
```

## File Organization

### Recommended Structure

```
proyecto-latex/
├── main.tex                 # Main document
├── referencias.bib          # Bibliography
├── images/                  # Images folder
│   ├── figura1.png
│   ├── figura2.pdf
│   └── diagrama1.png
├── chapters/                # Chapters (for large documents)
│   ├── introduccion.tex
│   ├── metodologia.tex
│   └── resultados.tex
├── code/                    # Code listings
│   ├── algoritmo1.py
│   └── implementacion.java
└── build/                   # Compilation output (gitignored)
    ├── main.pdf
    ├── main.aux
    ├── main.log
    └── main.bbl
```

## Troubleshooting

### Common Errors

```latex
% Error: Undefined control sequence
% Cause: Typo in command or missing package
% Fix: Check command spelling, add required \usepackage

% Error: Missing $ inserted
% Cause: Math symbols used outside math mode
% Fix: Use $...$ for inline math or \[...\] for display

% Error: File not found
% Cause: Image path incorrect
% Fix: Check \graphicspath and file names (case-sensitive)

% Error: Citation undefined
% Cause: BibTeX not run or label misspelled
% Fix: Run pdflatex → bibtex → pdflatex → pdflatex

% Error: Float too large
% Cause: Figure/table doesn't fit on page
% Fix: Use [p] placement or scale down image

% Warning: Overfull \hbox
% Cause: Line too wide (text overflows margin)
% Fix: Rephrase, hyphenate, or use \linebreak

% Warning: Reference undefined
% Cause: Need another compilation
% Fix: Compile again (need 2-3 runs for cross-refs)
```

## Delivery Checklist

Before delivering the LaTeX document:

- [ ] All [PLACEHOLDERS] replaced with actual data
- [ ] Language configured correctly (español/english)
- [ ] Code listing style configured (if needed)
- [ ] Appropriate packages included
- [ ] Bibliography file created (if needed)
- [ ] Compilation instructions provided
- [ ] File structure recommended
- [ ] Image folder instructions included
- [ ] Comments added to guide user

---

> "LaTeX: because your thesis deserves better than Word."

**Gather data first, generate beauty second.**
