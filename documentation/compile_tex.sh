#!/bin/bash

# Compile the LaTeX document to PDF
read -p "Enter the name of the LaTeX file (without extension): " tex_file
tex_file_name="${tex_file}.tex"
pdflatex -shell-escape $tex_file_name

# Clean up auxiliary files
rm -rf _minted-${tex_file}
rm ${tex_file}.aux ${tex_file}.log ${tex_file}.toc ${tex_file}.out ${tex_file}.lof texput.log .${tex_file}.tex.swp