const w = require("../dist/node");
const { readFileSync, writeFileSync } = require("fs");
const Zip = require("adm-zip");

describe("reader", () => {
  test("should read lvlOverride docx", () => {
    const buffer = readFileSync("../fixtures/lvl_override/override.docx");
    const json = w.readDocx(buffer);
    expect(json).toMatchSnapshot();
  });

  test("should read gridAfter docx", () => {
    const buffer = readFileSync("../fixtures/grid_after/grid_after.docx");
    const json = w.readDocx(buffer);
    expect(json).toMatchSnapshot();
  });

  test("should read tr2bl docx", () => {
    const buffer = readFileSync("../fixtures/tr2bl/tr2bl.docx");
    const json = w.readDocx(buffer);
    writeFileSync("../output/tr2bl.json", JSON.stringify(json, null, 2));
    expect(json).toMatchSnapshot();
  });

  test("should read custom docx", () => {
    const buffer = readFileSync("../fixtures/custom/custom.docx");
    const json = w.readDocx(buffer);
    writeFileSync("../output/custom.json", JSON.stringify(json, null, 2));
    expect(json).toMatchSnapshot();
  });

  test("should read table style docx", () => {
    const buffer = readFileSync("../fixtures/table_style/table_style.docx");
    const json = w.readDocx(buffer);
    expect(json).toMatchSnapshot();
  });

  test("should read extended comments docx", () => {
    const buffer = readFileSync(
      "../fixtures/extended_comments/extended_comments.docx"
    );
    const json = w.readDocx(buffer);
    expect(json).toMatchSnapshot();
  });

  test("should read multi paragraph comments docx", () => {
    const buf = readFileSync(
      "../fixtures/multi_paragraph_comment/multi_paragraph_comment.docx"
    );
    const json = w.readDocx(buf);
    expect(json).toMatchSnapshot();
  });

  test("should read div docx", () => {
    const buffer = readFileSync("../fixtures/div/div.docx");
    const json = w.readDocx(buffer);
    expect(json).toMatchSnapshot();
  });

  test("should read vertAlign docx", () => {
    const buffer = readFileSync("../fixtures/vert_align/vert_align.docx");
    const json = w.readDocx(buffer);
    expect(json).toMatchSnapshot();
  });

  test("should read line spacing docx", () => {
    const buffer = readFileSync(
        "../fixtures/line_spacing/line_spacing.docx"
    );
    const json = w.readDocx(buffer);
    expect(json).toMatchSnapshot();
  });
});

describe("writer", () => {
  test("should write hello", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello world!!"));
    const buffer = new w.Docx().addParagraph(p).build();
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });

  test("should write lvlOverride with level", () => {
    const p = new w.Paragraph()
      .addRun(new w.Run().addText("Hello world!!"))
      .numbering(0, 0);
    const num = new w.Numbering(0, 0);
    num.addOverride(
      new w.LevelOverride(0).overrideLevel(
        new w.Level(0, 3, "decimal", "%1", "left")
      )
    );
    const buffer = new w.Docx()
      .addParagraph(p)
      .addAbstractNumbering(new w.AbstractNumbering(0))
      .addNumbering(num)
      .build();

    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });

  test("should write page size", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello world!!"));
    const buffer = new w.Docx().addParagraph(p).pageSize(400, 800).build();
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });

  test("should write nested table", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello world!!"));
    const childTable = new w.Table().addRow(
      new w.TableRow().addCell(new w.TableCell().addParagraph(p))
    );
    const parentTable = new w.Table().addRow(
      new w.TableRow().addCell(new w.TableCell().addTable(childTable))
    );
    const buffer = new w.Docx().addTable(parentTable).build();
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
    writeFileSync("../output/nested_table.docx", buffer);
  });

  test("should write tl2br and tr2bl cells", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello!!"));
    const table = new w.Table().addRow(
      new w.TableRow()
        .addCell(
          new w.TableCell()
            .setBorder(new w.TableCellBorder("tl2br"))
            .addParagraph(p)
        )
        .addCell(
          new w.TableCell()
            .setBorder(new w.TableCellBorder("tr2bl"))
            .addParagraph(p)
        )
        .addCell(
          new w.TableCell()
            .setBorder(new w.TableCellBorder("tr2bl"))
            .setBorder(new w.TableCellBorder("tl2br"))
            .addParagraph(p)
        )
    );
    const buffer = new w.Docx().addTable(table).build();
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
    writeFileSync("../output/cell_borders.docx", buffer);
  });

  test("should write cell shading", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello!!"));
    const table = new w.Table().addRow(
      new w.TableRow().addCell(
        new w.TableCell().addParagraph(p).shading("clear", "auto", "FF0000")
      )
    );
    const buffer = new w.Docx().addTable(table).build();
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
    writeFileSync("../output/cell_shading.docx", buffer);
  });

  test("should write page margin", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello world!!"));
    const buffer = new w.Docx()
      .addParagraph(p)
      .pageMargin({ top: 1000, left: 2000 })
      .build();
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });

  test("should write default font", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello world!!!!"));
    const fonts = new w.RunFonts()
      .eastAsia("Arial")
      .ascii("Arial")
      .hiAnsi("Arial");
    const buffer = new w.Docx()
      .addParagraph(p)
      .defaultSize(40)
      .defaultFonts(fonts)
      .build();
    writeFileSync("../output/default_font.docx", buffer);
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });

  test("should write doc vars", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello world!!!!"));
    const buffer = new w.Docx().addParagraph(p).addDocVar("foo", "bar").build();
    writeFileSync("../output/doc_vars.docx", buffer);
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });

  test("should write doc grid", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello world!!!!"));
    const buffer = new w.Docx().addParagraph(p).docGrid("default", 360).build();
    writeFileSync("../output/doc_grid.docx", buffer);
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });

  test("should write table layout", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello!!"));
    const table = new w.Table()
      .addRow(new w.TableRow().addCell(new w.TableCell().addParagraph(p)))
      .layout("fixed");
    const buffer = new w.Docx().addTable(table).build();
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
    writeFileSync("../output/table_layout.docx", buffer);
  });

  test("should write text border", () => {
    const p = new w.Paragraph()
      .addRun(new w.Run().addText("Hello "))
      .addRun(new w.Run().addText("World!").textBorder("single", 4, 0, "auto"));
    const buffer = new w.Docx().addParagraph(p).build();
    writeFileSync("../output/text_border.docx", buffer);
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });

  test("should write page orientation", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello "));
    const buffer = new w.Docx()
      .addParagraph(p)
      .pageSize(16838, 11906)
      .pageOrientation("landscape")
      .build();
    writeFileSync("../output/page_orientation.docx", buffer);
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });

  test("should write custom props", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello!!"));
    const buffer = new w.Docx()
      .addParagraph(p)
      .customProperty("hello", '{"world": 0}')
      .build();
    writeFileSync("../output/custom.docx", buffer);
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml|custom.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });

  test("should write webextension", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello!!"));
    const buffer = new w.Docx()
      .addParagraph(p)
      .taskpanes()
      .webextension(
        new w.WebExtension(
          "7f33b723-fb58-4524-8733-dbedc4b7c095",
          "abcd",
          "1.0.0.0",
          "developer",
          "Registry"
        ).property("hello", JSON.stringify({ hello: "world" }))
      )
      .build();
    writeFileSync("../output/webextension.docx", buffer);
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/webextension1.xml|_rels|taskpanes.xml.rel/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });

  test("should write customItem", () => {
    const p = new w.Paragraph().addRun(new w.Run().addText("Hello!!"));
    const buffer = new w.Docx()
      .addParagraph(p)
      .addCustomItem(
        "06AC5857-5C65-A94A-BCEC-37356A209BC3",
        '<root xmlns="https://example.com"><item name="Cheap Item" price="$193.95"/><item name="Expensive Item" price="$931.88"/></root>'
      )
      .build();
    writeFileSync("../output/custom-item.docx", buffer);
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/item1.xml|_rels|item1Props/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });

  test("should write line spacing", () => {
    const p = new w.Paragraph()
        .addRun(new w.Run().addText("Hello "))
        .lineSpacing(100, "", 100, 1);
    const buffer = new w.Docx().addParagraph(p).build();
    writeFileSync("../output/line_spacing.docx", buffer);
    const z = new Zip(Buffer.from(buffer));
    for (const e of z.getEntries()) {
      if (e.entryName.match(/document.xml|numbering.xml/)) {
        expect(z.readAsText(e)).toMatchSnapshot();
      }
    }
  });
});
