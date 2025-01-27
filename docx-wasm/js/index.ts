import {Paragraph} from "./paragraph";
import {Insert} from "./insert";
import {Delete} from "./delete";
import {DeleteText} from "./delete-text";
import {Table} from "./table";
import {TableCell, toTextDirectionWasmType} from "./table-cell";
import {BorderType} from "./border";
import {Run, RunFonts} from "./run";
import {Text} from "./text";
import {Tab} from "./tab";
import {Break} from "./break";
import {Comment} from "./comment";
import {CommentEnd} from "./comment-end";
import {AbstractNumbering} from "./abstract-numbering";
import {Numbering} from "./numbering";
import {BookmarkStart} from "./bookmark-start";
import {BookmarkEnd} from "./bookmark-end";
import {Settings} from "./settings";
import {DocProps} from "./doc-props";
import {Styles} from "./styles";
import {WebExtension} from "./webextension";
import {
    SectionProperty,
    PageMargin,
    PageOrientationType,
} from "./section-property";
import {DocGridType, DocxJSON, WidthType} from "./json";

import * as wasm from "./pkg";
import {Level} from "./level";

const convertBorderType = (t: BorderType) => {
    switch (t) {
        case "nil":
            return wasm.BorderType.Nil;
        case "none":
            return wasm.BorderType.None;
        case "single":
            return wasm.BorderType.Single;
        case "thick":
            return wasm.BorderType.Thick;
        case "double":
            return wasm.BorderType.Double;
        case "dotted":
            return wasm.BorderType.Dotted;
        case "dashed":
            return wasm.BorderType.Dashed;
        case "dotDash":
            return wasm.BorderType.DotDash;
        case "dotDotDash":
            return wasm.BorderType.DotDotDash;
        case "triple":
            return wasm.BorderType.Triple;
        default:
            return wasm.BorderType.Single;
    }
};

const convertWidthType = (t: WidthType) => {
    switch (t) {
        case "nil":
            return wasm.WidthType.Nil;
        case "Pct":
            return wasm.WidthType.Pct;
        case "DXA":
            return wasm.WidthType.DXA;
        case "Auto":
            return wasm.WidthType.Auto;
        default:
            return wasm.WidthType.DXA;
    }
};

export class Docx {
    children: (Paragraph | Table | BookmarkStart | BookmarkEnd)[] = [];
    hasNumberings = false;
    abstractNumberings: AbstractNumbering[] = [];
    numberings: Numbering[] = [];
    settings: Settings = new Settings();
    docProps: DocProps = new DocProps();
    sectionProperty: SectionProperty = new SectionProperty();
    _taskpanes: boolean = false;
    webextensions: WebExtension[] = [];
    customItems: { id: string; xml: string }[] = [];
    styles = new Styles();

    addParagraph(p: Paragraph) {
        if (p.hasNumberings) {
            this.hasNumberings = true;
        }
        this.children.push(p);
        return this;
    }

    addBookmarkStart(id: number, name: string) {
        this.children.push(new BookmarkStart(id, name));
        return this;
    }

    addBookmarkEnd(id: number) {
        this.children.push(new BookmarkEnd(id));
        return this;
    }

    addTable(t: Table) {
        if (t.hasNumberings) {
            this.hasNumberings = true;
        }
        this.children.push(t);
        return this;
    }

    addAbstractNumbering(num: AbstractNumbering) {
        this.abstractNumberings.push(num);
        return this;
    }

    addNumbering(num: Numbering) {
        this.numberings.push(num);
        return this;
    }

    docId(id: string) {
        this.settings.docId(id);
        return this;
    }

    defaultTabStop(stop: number) {
        this.settings.defaultTabStop(stop);
        return this;
    }

    createdAt(date: string) {
        this.docProps.createdAt(date);
        return this;
    }

    customProperty(name: string, item: string) {
        this.docProps.customProperty(name, item);
        return this;
    }

    updatedAt(date: string) {
        this.docProps.updatedAt(date);
        return this;
    }

    addDocVar(name: string, val: string) {
        this.settings.addDocVar(name, val);
        return this;
    }

    pageSize(w: number, h: number) {
        this.sectionProperty.pageSize(w, h);
        return this;
    }

    pageMargin(margin: Partial<PageMargin>) {
        this.sectionProperty.pageMargin(margin);
        return this;
    }

    pageOrientation(o: PageOrientationType) {
        this.sectionProperty.pageOrientation(o);
        return this;
    }

    docGrid(type: DocGridType, linePitch?: number, charSpace?: number) {
        this.sectionProperty.docGrid(type, linePitch, charSpace);
        return this;
    }

    defaultSize(size: number) {
        this.styles.defaultSize(size);
        return this;
    }

    defaultFonts(fonts: RunFonts) {
        this.styles.defaultFonts(fonts);
        return this;
    }

    defaultSpacing(spacing: number) {
        this.styles.defaultSpacing(spacing);
        return this;
    }

    taskpanes() {
        this._taskpanes = true;
        return this;
    }

    webextension(e: WebExtension) {
        this.webextensions.push(e);
        return this;
    }

    addCustomItem(id: string, xml: string) {
        this.customItems.push({id, xml});
        return this;
    }

    buildRunFonts = (fonts: RunFonts | undefined) => {
        let f = wasm.createRunFonts();
        if (fonts?._ascii) {
            f = f.ascii(fonts._ascii);
        }
        if (fonts?._hiAnsi) {
            f = f.hi_ansi(fonts._hiAnsi);
        }
        if (fonts?._cs) {
            f = f.cs(fonts._cs);
        }
        if (fonts?._eastAsia) {
            f = f.east_asia(fonts._eastAsia);
        }
        return f;
    };

    buildRun(r: Run) {
        let run = wasm.createRun();
        r.children.forEach((child) => {
            if (child instanceof Text) {
                run = run.add_text(child.text);
            } else if (child instanceof DeleteText) {
                run = run.add_delete_text(child.text);
            } else if (child instanceof Tab) {
                run = run.add_tab();
            } else if (child instanceof Break) {
                if (child.type === "column") {
                    run = run.add_break(wasm.BreakType.Column);
                } else if (child.type === "page") {
                    run = run.add_break(wasm.BreakType.Page);
                } else if (child.type === "textWrapping") {
                    run = run.add_break(wasm.BreakType.TextWrapping);
                }
            }
        });

        if (typeof r.property.size !== "undefined") {
            run = run.size(r.property.size);
        }

        if (r.property.color) {
            run = run.color(r.property.color);
        }

        if (r.property.highlight) {
            run = run.highlight(r.property.highlight);
        }

        if (r.property.vertAlign) {
            if (r.property.vertAlign === "superscript") {
                run = run.vert_align(wasm.VertAlignType.SuperScript);
            } else if (r.property.vertAlign === "subscript") {
                run = run.vert_align(wasm.VertAlignType.SubScript);
            }
        }

        if (r.property.bold) {
            run = run.bold();
        }

        if (r.property.italic) {
            run = run.italic();
        }

        if (r.property.underline) {
            run = run.underline(r.property.underline);
        }

        if (r.property.vanish) {
            run = run.vanish();
        }

        if (r.property.spacing != null) {
            run = run.spacing(r.property.spacing);
        }

        if (r.property.textBorder) {
            const {borderType, color, space, size} = r.property.textBorder;
            run = run.text_border(convertBorderType(borderType), size, space, color);
        }

        const fonts = this.buildRunFonts(r.property.fonts);
        run = run.fonts(fonts);

        return run;
    }

    buildInsert(i: Insert) {
        const run = this.buildRun(i.run);
        let insert = wasm.createInsert(run);
        if (i._author) {
            insert = insert.author(i._author);
        }
        if (i._date) {
            insert = insert.date(i._date);
        }
        return insert;
    }

    buildDelete(d: Delete) {
        const run = this.buildRun(d.run);
        let del = wasm.createDelete(run);
        if (d._author) {
            del = del.author(d._author);
        }
        if (d._date) {
            del = del.date(d._date);
        }
        return del;
    }

    buildComment(c: Comment) {
        let comment = wasm.createComment(c.id);
        c.children.forEach((child) => {
            if (child instanceof Paragraph) {
                comment = comment.add_paragraph(this.buildParagraph(child));
            } else if (child instanceof Table) {
                // TODO:
            }
        });
        if (c._author) {
            comment = comment.author(c._author);
        }
        if (c._date) {
            comment = comment.date(c._date);
        }
        if (c._parentCommentId) {
            comment = comment.parent_comment_id(c._parentCommentId);
        }
        return comment;
    }

    buildParagraph(p: Paragraph) {
        let paragraph = wasm.createParagraph();
        p.children.forEach((child) => {
            if (child instanceof Run) {
                const run = this.buildRun(child);
                paragraph = paragraph.add_run(run);
            } else if (child instanceof Insert) {
                const insert = this.buildInsert(child);
                paragraph = paragraph.add_insert(insert);
            } else if (child instanceof Delete) {
                const del = this.buildDelete(child);
                paragraph = paragraph.add_delete(del);
            } else if (child instanceof BookmarkStart) {
                paragraph = paragraph.add_bookmark_start(child.id, child.name);
            } else if (child instanceof BookmarkEnd) {
                paragraph = paragraph.add_bookmark_end(child.id);
            } else if (child instanceof Comment) {
                const comment = this.buildComment(child);
                paragraph = paragraph.add_comment_start(comment);
            } else if (child instanceof CommentEnd) {
                paragraph = paragraph.add_comment_end(child.id);
            }
        });

        switch (p.property.align) {
            case "center": {
                paragraph = paragraph.align(wasm.AlignmentType.Center);
                break;
            }
            case "right": {
                paragraph = paragraph.align(wasm.AlignmentType.Right);
                break;
            }
            case "justified": {
                paragraph = paragraph.align(wasm.AlignmentType.Justified);
                break;
            }
            case "left": {
                paragraph = paragraph.align(wasm.AlignmentType.Left);
                break;
            }
            case "distribute": {
                paragraph = paragraph.align(wasm.AlignmentType.Distribute);
                break;
            }
            case "both": {
                paragraph = paragraph.align(wasm.AlignmentType.Both);
                break;
            }
            case "end": {
                paragraph = paragraph.align(wasm.AlignmentType.End);
                break;
            }
        }

        if (typeof p.property.indent !== "undefined") {
            const {indent} = p.property;
            let kind;
            switch (p.property.indent.specialIndentKind) {
                case "firstLine": {
                    kind = wasm.SpecialIndentKind.FirstLine;
                    break;
                }
                case "hanging": {
                    kind = wasm.SpecialIndentKind.Hanging;
                    break;
                }
            }
            paragraph = paragraph.indent(indent.left, kind, indent.specialIndentSize);
        }

        if (typeof p.property.numbering !== "undefined") {
            const {numbering} = p.property;
            paragraph = paragraph.numbering(numbering.id, numbering.level);
        }

        if (typeof p.property.styleId !== "undefined") {
            paragraph = paragraph.style(p.property.styleId);
        }

        if (p.property.runProperty.bold) {
            paragraph = paragraph.bold();
        }

        if (typeof p.property.lineSpacing !== "undefined") {
            const {lineSpacing} = p.property;
            let kind;
            switch (p.property.lineSpacing.lineRule) {
                case "atLeast": {
                    kind = wasm.LineSpacingType.AtLeast;
                    break;
                }
                case "auto": {
                    kind = wasm.LineSpacingType.Auto;
                    break;
                }
                case "exact": {
                    kind = wasm.LineSpacingType.Exact;
                    break;
                }
            }
            paragraph = paragraph.line_spacing(lineSpacing.before, lineSpacing.after, lineSpacing.line, kind);
        }

        if (p.property.runProperty.italic) {
            paragraph = paragraph.italic();
        }

        if (p.property.runProperty.size) {
            paragraph = paragraph.size(p.property.runProperty.size);
        }

        if (p.property.runProperty.fonts) {
            let f = wasm.createRunFonts();
            if (p.property.runProperty.fonts._ascii) {
                f = f.ascii(p.property.runProperty.fonts._ascii);
            }
            if (p.property.runProperty.fonts._hiAnsi) {
                f = f.hi_ansi(p.property.runProperty.fonts._hiAnsi);
            }
            if (p.property.runProperty.fonts._cs) {
                f = f.cs(p.property.runProperty.fonts._cs);
            }
            if (p.property.runProperty.fonts._eastAsia) {
                f = f.east_asia(p.property.runProperty.fonts._eastAsia);
            }
            paragraph = paragraph.fonts(f);
        }

        if (p.property.keepLines) {
            paragraph = paragraph.keep_lines(true);
        }

        if (p.property.keepNext) {
            paragraph = paragraph.keep_next(true);
        }

        if (p.property.pageBreakBefore) {
            paragraph = paragraph.page_break_before(true);
        }

        if (p.property.windowControl) {
            paragraph = paragraph.window_control(true);
        }

        return paragraph;
    }

    buildTable(t: Table) {
        let table = wasm.createTable();
        t.rows.forEach((r) => {
            let row = wasm.createTableRow();
            r.cells.forEach((c) => {
                const cell = this.buildCell(c);
                row = row.add_cell(cell);
            });

            if (r.height) {
                row = row.row_height(r.height);
            }

            if (r.hRule) {
                switch (r.hRule) {
                    case "auto": {
                        row = row.height_rule(wasm.HeightRule.Auto);
                        break;
                    }
                    case "atLeast": {
                        row = row.height_rule(wasm.HeightRule.AtLeast);
                        break;
                    }
                    case "exact": {
                        row = row.height_rule(wasm.HeightRule.Exact);
                        break;
                    }
                }
            }
            table = table.add_row(row);
        });
        table = table.set_grid(new Uint32Array(t.grid));
        table = table.indent(t.property.indent || 0);

        if (t.property.cellMargins) {
            const {top, right, bottom, left} = t.property.cellMargins;
            table = table
                .cell_margin_top(top.val, convertWidthType(top.type))
                .cell_margin_right(right.val, convertWidthType(right.type))
                .cell_margin_bottom(bottom.val, convertWidthType(bottom.type))
                .cell_margin_left(left.val, convertWidthType(left.type));
        }

        switch (t.property.align) {
            case "center": {
                table = table.align(wasm.TableAlignmentType.Center);
                break;
            }
            case "right": {
                table = table.align(wasm.TableAlignmentType.Right);
                break;
            }
            case "left": {
                table = table.align(wasm.TableAlignmentType.Left);
                break;
            }
        }

        switch (t.property.layout) {
            case "fixed": {
                table = table.layout(wasm.TableLayoutType.Fixed);
                break;
            }
            case "autofit": {
                table = table.layout(wasm.TableLayoutType.Autofit);
                break;
            }
        }

        return table;
    }

    buildCell(c: TableCell) {
        let cell = wasm.createTableCell();
        c.children.forEach((c) => {
            if (c instanceof Paragraph) {
                const paragraph = this.buildParagraph(c);
                cell = cell.add_paragraph(paragraph);
            } else if (c instanceof Table) {
                const table = this.buildTable(c);
                cell = cell.add_table(table);
            }
        });

        if (c.property.verticalMerge === "continue") {
            cell = cell.vertical_merge(wasm.VMergeType.Continue);
        } else if (c.property.verticalMerge === "restart") {
            cell = cell.vertical_merge(wasm.VMergeType.Restart);
        }

        switch (c.property.verticalAlign) {
            case "top": {
                cell = cell.vertical_align(wasm.VAlignType.Top);
                break;
            }
            case "center": {
                cell = cell.vertical_align(wasm.VAlignType.Center);
                break;
            }
            case "bottom": {
                cell = cell.vertical_align(wasm.VAlignType.Bottom);
                break;
            }
        }

        if (typeof c.property.gridSpan !== "undefined") {
            cell = cell.grid_span(c.property.gridSpan);
        }

        if (typeof c.property.width !== "undefined") {
            cell = cell.width(c.property.width);
        }

        if (typeof c.property.textDirection !== "undefined") {
            cell = cell.text_direction(
                toTextDirectionWasmType(c.property.textDirection)
            );
        }

        if (typeof c.property.borders !== "undefined") {
            cell = this.buildCellBorders(c, cell);
        }

        if (typeof c.property.shading !== "undefined") {
            cell = cell.shading(
                c.property.shading._type,
                c.property.shading._color,
                c.property.shading._fill
            );
        }

        return cell;
    }

    buildCellBorders(js: TableCell, cell: wasm.TableCell): wasm.TableCell {
        if (js.property.borders.top) {
            const border = wasm
                .createTableCellBorder(wasm.TableCellBorderPosition.Top)
                .size(js.property.borders.top._size)
                .color(js.property.borders.top._color)
                .border_type(convertBorderType(js.property.borders.top._border_type));
            cell = cell.set_border(border);
        }

        if (js.property.borders.right) {
            const border = wasm
                .createTableCellBorder(wasm.TableCellBorderPosition.Right)
                .size(js.property.borders.right._size)
                .color(js.property.borders.right._color)
                .border_type(convertBorderType(js.property.borders.right._border_type));
            cell = cell.set_border(border);
        }

        if (js.property.borders.bottom) {
            const border = wasm
                .createTableCellBorder(wasm.TableCellBorderPosition.Bottom)
                .size(js.property.borders.bottom._size)
                .color(js.property.borders.bottom._color)
                .border_type(
                    convertBorderType(js.property.borders.bottom._border_type)
                );
            cell = cell.set_border(border);
        }

        if (js.property.borders.left) {
            const border = wasm
                .createTableCellBorder(wasm.TableCellBorderPosition.Left)
                .size(js.property.borders.left._size)
                .color(js.property.borders.left._color)
                .border_type(convertBorderType(js.property.borders.left._border_type));
            cell = cell.set_border(border);
        }

        if (js.property.borders.insideH) {
            const border = wasm
                .createTableCellBorder(wasm.TableCellBorderPosition.InsideH)
                .size(js.property.borders.insideH._size)
                .color(js.property.borders.insideH._color)
                .border_type(
                    convertBorderType(js.property.borders.insideH._border_type)
                );
            cell = cell.set_border(border);
        }

        if (js.property.borders.insideV) {
            const border = wasm
                .createTableCellBorder(wasm.TableCellBorderPosition.InsideV)
                .size(js.property.borders.insideV._size)
                .color(js.property.borders.insideV._color)
                .border_type(
                    convertBorderType(js.property.borders.insideV._border_type)
                );
            cell = cell.set_border(border);
        }

        if (js.property.borders.tl2br) {
            const border = wasm
                .createTableCellBorder(wasm.TableCellBorderPosition.Tl2br)
                .size(js.property.borders.tl2br._size)
                .color(js.property.borders.tl2br._color)
                .border_type(convertBorderType(js.property.borders.tl2br._border_type));
            cell = cell.set_border(border);
        }

        if (js.property.borders.tr2bl) {
            const border = wasm
                .createTableCellBorder(wasm.TableCellBorderPosition.Tr2bl)
                .size(js.property.borders.tr2bl._size)
                .color(js.property.borders.tr2bl._color)
                .border_type(convertBorderType(js.property.borders.tr2bl._border_type));
            cell = cell.set_border(border);
        }

        return cell;
    }

    buildLevel(l: Level) {
        let level = wasm.createLevel(l.id, l.start, l.format, l.text, l.jc);

        if (l.levelSuffix === "nothing") {
            level = level.suffix(wasm.LevelSuffixType.Nothing);
        } else if (l.levelSuffix === "space") {
            level = level.suffix(wasm.LevelSuffixType.Space);
        } else {
            level = level.suffix(wasm.LevelSuffixType.Tab);
        }

        if (l.runProperty.bold) {
            level = level.bold();
        }

        if (l.runProperty.italic) {
            level = level.italic();
        }

        if (l.runProperty.size) {
            level = level.size(l.runProperty.size);
        }

        if (l.runProperty.fonts) {
            let f = wasm.createRunFonts();
            if (l.runProperty.fonts._ascii) {
                f = f.ascii(l.runProperty.fonts._ascii);
            }
            if (l.runProperty.fonts._hiAnsi) {
                f = f.hi_ansi(l.runProperty.fonts._hiAnsi);
            }
            if (l.runProperty.fonts._cs) {
                f = f.cs(l.runProperty.fonts._cs);
            }
            if (l.runProperty.fonts._eastAsia) {
                f = f.east_asia(l.runProperty.fonts._eastAsia);
            }
            level = level.fonts(f);
        }

        if (l.paragraphProperty.indent) {
            let kind;
            if (l.paragraphProperty.indent.specialIndentKind === "firstLine") {
                kind = wasm.SpecialIndentKind.FirstLine;
            } else if (l.paragraphProperty.indent.specialIndentKind === "hanging") {
                kind = wasm.SpecialIndentKind.Hanging;
            }
            level = level.indent(
                l.paragraphProperty.indent.left,
                kind,
                l.paragraphProperty.indent.specialIndentSize
            );
        }
        return level;
    }

    createDocx(): wasm.Docx {
        let docx = wasm.createDocx();

        this.children.forEach((child) => {
            if (child instanceof Paragraph) {
                let p = this.buildParagraph(child);
                docx = docx.add_paragraph(p);
            } else if (child instanceof Table) {
                let t = this.buildTable(child);
                docx = docx.add_table(t);
            } else if (child instanceof BookmarkStart) {
                docx = docx.add_bookmark_start(child.id, child.name);
            } else if (child instanceof BookmarkEnd) {
                docx = docx.add_bookmark_end(child.id);
            }
        });

        this.abstractNumberings.forEach((n) => {
            let num = wasm.createAbstractNumbering(n.id);
            n.levels.forEach((l) => {
                const level = this.buildLevel(l);
                num = num.add_level(level);
            });
            docx = docx.add_abstract_numbering(num);
        });

        this.numberings.forEach((n) => {
            let num = wasm.createNumbering(n.id, n.abstractNumId);
            n.overrides.forEach((o) => {
                let levelOverride = wasm.createLevelOverride(o.level);
                if (o.startOverride !== null) {
                    levelOverride = levelOverride.start(o.startOverride);
                }
                if (o.levelOverride !== null) {
                    let level = wasm.createLevel(
                        o.levelOverride.level,
                        o.levelOverride.start,
                        o.levelOverride.format,
                        o.levelOverride.text,
                        o.levelOverride.jc
                    );
                    levelOverride = levelOverride.level(level);
                }
                num = num.add_override(levelOverride);
            });
            docx = docx.add_numbering(num);
        });

        if (this.settings._docId) {
            docx = docx.doc_id(this.settings._docId);
        }

        docx = docx.default_tab_stop(this.settings._defaultTabStop);

        this.settings._docVars.forEach((v) => {
            docx = docx.add_doc_var(v.name, v.val);
        });

        if (this.sectionProperty._pageMargin) {
            const {top, left, right, bottom, header, footer, gutter} =
                this.sectionProperty._pageMargin;
            const margin = wasm
                .createPageMargin()
                .top(top)
                .left(left)
                .right(right)
                .bottom(bottom)
                .header(header)
                .footer(footer)
                .gutter(gutter);
            docx = docx.page_margin(margin);
        }

        if (this.sectionProperty._pageSize) {
            const {w, h, orient} = this.sectionProperty._pageSize;
            docx = docx.page_size(w, h);
            switch (orient) {
                case "landscape":
                    docx = docx.page_orient(wasm.PageOrientationType.Landscape);
                    break;
                case "portrait":
                    docx = docx.page_orient(wasm.PageOrientationType.Portrait);
                    break;
            }
        }

        if (this.sectionProperty._docGrid) {
            const {gridType, charSpace, linePitch} = this.sectionProperty._docGrid;
            let type = wasm.DocGridType.Default;
            switch (gridType) {
                case "lines":
                    type = wasm.DocGridType.Lines;
                    break;
                case "linesAndChars":
                    type = wasm.DocGridType.LinesAndChars;
                    break;
                case "snapToChars":
                    type = wasm.DocGridType.SnapToChars;
                    break;
                case "default":
                    break;
            }
            docx = docx.doc_grid(type, linePitch, charSpace);
        }

        if (this.styles?.docDefaults) {
            if (this.styles.docDefaults.runProperty?.fonts) {
                const fonts = this.buildRunFonts(
                    this.styles.docDefaults.runProperty.fonts
                );
                docx = docx.default_fonts(fonts);
            }

            if (this.styles.docDefaults.runProperty?.size) {
                docx = docx.default_size(this.styles.docDefaults.runProperty.size);
            }

            if (this.styles.docDefaults.runProperty?.spacing) {
                docx = docx.default_spacing(
                    this.styles.docDefaults.runProperty.spacing
                );
            }
        }

        if (this.docProps._createdAt) {
            docx = docx.created_at(this.docProps._createdAt);
        }

        if (this.docProps._updatedAt) {
            docx = docx.updated_at(this.docProps._updatedAt);
        }

        Object.entries(this.docProps._customProperties).forEach(([key, item]) => {
            docx = docx.custom_property(key, item);
        });

        if (this.docProps._updatedAt) {
            docx = docx.updated_at(this.docProps._updatedAt);
        }

        if (this._taskpanes) {
            docx = docx.taskpanes();

            for (const e of this.webextensions) {
                let ext = wasm.createWebExtension(
                    e._id,
                    e._referenceId,
                    e._version,
                    e._store,
                    e._storeType
                );
                for (const [name, value] of Object.entries(e.properties)) {
                    ext = ext.property(name, value);
                }
                docx = docx.web_extension(ext);
            }
        }

        for (const item of this.customItems) {
            docx = docx.add_custom_item(item.id, item.xml);
        }

        return docx;
    }

    json() {
        const docx = this.createDocx();
        const json = docx.json_with_update_comments();
        docx.free();
        return JSON.parse(json) as DocxJSON;
    }

    build() {
        const docx = this.createDocx();
        const buf = docx.build(this.hasNumberings);
        docx.free();
        return buf;
    }
}

export const readDocx = (buf: Uint8Array) => {
    return JSON.parse(wasm.readDocx(buf)) as DocxJSON;
};

export * from "./paragraph";
export * from "./insert";
export * from "./delete";
export * from "./border";
export * from "./table";
export * from "./table-cell";
export * from "./table-cell-border";
export * from "./table-cell-borders";
export * from "./table-row";
export * from "./run";
export * from "./text";
export * from "./style";
export * from "./styles";
export * from "./comment";
export * from "./comment-end";
export * from "./numbering";
export * from "./abstract-numbering";
export * from "./bookmark-start";
export * from "./bookmark-end";
export * from "./break";
export * from "./delete-text";
export * from "./level";
export * from "./tab";
export * from "./json";
export * from "./webextension";
