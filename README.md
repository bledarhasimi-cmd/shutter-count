# RAW Shutter Count

Miniweb per te lexuar shutter count nga RAW files direkt ne browser.

Faqja pranon vetem RAW file dhe mundohet te gjeje:

- total shutter count
- mechanical shutter count
- electronic shutter count
- modelin e aparatit
- serial number, kur gjendet ne metadata

File-i nuk ngarkohet ne server. Leximi behet lokalisht ne browser.

## Linku publik

Pasi GitHub Pages te mbaroje deploy, faqja hapet ketu:

https://bledarhasimi-cmd.github.io/shutter-count/

## Kufizim i rendesishem

Jo cdo aparat i ruan mechanical dhe electronic shutter count ne RAW metadata. Kur aparati nuk e shkruan kete informacion, faqja do e shenoje si `Nuk u gjet`.

Per leximin me te plote te te gjitha markave, versioni me i sakte eshte ai me `exiftool` ne server ose ne kompjuter lokal. Ky version eshte bere si miniweb publik brenda GitHub Pages.
