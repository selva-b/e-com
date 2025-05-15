'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link, 
  Image, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  Type
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter content here...',
  className = '',
  minHeight = '300px',
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = React.useRef<HTMLDivElement>(null);

  // Initialize editor once mounted
  useEffect(() => {
    setIsMounted(true);
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  // Update the editor content when value prop changes
  useEffect(() => {
    if (isMounted && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value, isMounted]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Execute command on the document
  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  // Insert HTML at cursor position
  const insertHTML = (html: string) => {
    document.execCommand('insertHTML', false, html);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Handle link insertion
  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  // Handle image insertion
  const handleImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      insertHTML(`<img src="${url}" alt="Image" style="max-width: 100%;" />`);
    }
  };

  // Handle variable insertion
  const handleVariable = () => {
    const variable = prompt('Enter variable name (without {{ }}):');
    if (variable) {
      insertHTML(`{{${variable}}}`);
    }
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <div className="toolbar flex flex-wrap gap-1 mb-2 p-2 bg-muted rounded-md">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="border-r border-border h-8 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', '<h1>')}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', '<h2>')}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', '<h3>')}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', '<p>')}
          title="Paragraph"
        >
          <Type className="h-4 w-4" />
        </Button>
        <div className="border-r border-border h-8 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="border-r border-border h-8 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyLeft')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyCenter')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyRight')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="border-r border-border h-8 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLink}
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImage}
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', '<pre>')}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="border-r border-border h-8 mx-1"></div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleVariable}
          title="Insert Variable"
          className="ml-auto"
        >
          Insert Variable
        </Button>
      </div>
      <div
        ref={editorRef}
        className="editor p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        style={{ minHeight }}
        placeholder={placeholder}
      />
    </div>
  );
}
