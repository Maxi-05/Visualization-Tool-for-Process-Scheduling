#!/bin/bash

# Compile the LaTeX document to PDF
pdflatex -shell-escape report.tex

# Clean up auxiliary files
rm report.aux report.log report.toc report.out report.lof texput.log