use super::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug)]
pub struct Paragraph(docx_rs::Paragraph);

#[wasm_bindgen(js_name = createParagraph)]
pub fn create_paragraph() -> Paragraph {
    Paragraph(docx_rs::Paragraph::new())
}

#[wasm_bindgen]
impl Paragraph {
    pub fn add_run(mut self, run: Run) -> Paragraph {
        self.0 = self.0.add_run(run.take());
        self
    }

    pub fn add_insert(mut self, i: Insert) -> Paragraph {
        self.0
            .children
            .push(docx_rs::ParagraphChild::Insert(i.take()));
        self
    }

    pub fn add_delete(mut self, d: Delete) -> Paragraph {
        self.0
            .children
            .push(docx_rs::ParagraphChild::Delete(d.take()));
        self
    }

    pub fn add_bookmark_start(mut self, id: usize, name: &str) -> Paragraph {
        self.0.children.push(docx_rs::ParagraphChild::BookmarkStart(
            docx_rs::BookmarkStart::new(id, name),
        ));
        self
    }

    pub fn add_bookmark_end(mut self, id: usize) -> Paragraph {
        self.0.children.push(docx_rs::ParagraphChild::BookmarkEnd(
            docx_rs::BookmarkEnd::new(id),
        ));
        self
    }

    pub fn add_comment_start(mut self, comment: Comment) -> Paragraph {
        self.0
            .children
            .push(docx_rs::ParagraphChild::CommentStart(Box::new(
                docx_rs::CommentRangeStart::new(comment.take()),
            )));
        self
    }

    pub fn add_comment_end(mut self, id: usize) -> Paragraph {
        self.0.children.push(docx_rs::ParagraphChild::CommentEnd(
            docx_rs::CommentRangeEnd::new(id),
        ));
        self
    }

    pub fn align(mut self, alignment_type: docx_rs::AlignmentType) -> Paragraph {
        self.0.property = self.0.property.align(alignment_type);
        self
    }

    pub fn style(mut self, style_id: &str) -> Paragraph {
        self.0.property = self.0.property.style(style_id);
        self
    }

    pub fn indent(
        mut self,
        left: i32,
        special_indent_kind: Option<docx_rs::SpecialIndentKind>,
        special_indent_size: Option<i32>,
    ) -> Paragraph {
        let special_indent = create_special_indent(special_indent_kind, special_indent_size);
        self.0.property = self
            .0
            .property
            .indent(Some(left), special_indent, None, None);
        self
    }

    pub fn numbering(mut self, id: usize, level: usize) -> Self {
        let id = docx_rs::NumberingId::new(id);
        let level = docx_rs::IndentLevel::new(level);
        self.0.property = self.0.property.numbering(id, level);
        self
    }

    pub fn size(mut self, size: usize) -> Self {
        self.0 = self.0.size(size);
        self
    }

    pub fn bold(mut self) -> Self {
        self.0 = self.0.bold();
        self
    }

    pub fn italic(mut self) -> Self {
        self.0 = self.0.italic();
        self
    }

    pub fn fonts(mut self, f: RunFonts) -> Self {
        self.0 = self.0.fonts(f.take());
        self
    }

    pub fn line_spacing(
        mut self,
        before: Option<u32>,
        after: Option<u32>,
        line: Option<u32>,
        spacing_type: Option<docx_rs::LineSpacingType>,
    ) -> Self {
        self.0 = self.0.line_spacing(before, after, line, spacing_type);
        self
    }

    pub fn keep_next(mut self, v: bool) -> Self {
        self.0 = self.0.keep_next(v);
        self
    }

    pub fn keep_lines(mut self, v: bool) -> Self {
        self.0 = self.0.keep_lines(v);
        self
    }

    pub fn page_break_before(mut self, v: bool) -> Self {
        self.0 = self.0.page_break_before(v);
        self
    }

    pub fn window_control(mut self, v: bool) -> Self {
        self.0 = self.0.window_control(v);
        self
    }
}

impl Paragraph {
    pub fn take(self) -> docx_rs::Paragraph {
        self.0
    }
}
