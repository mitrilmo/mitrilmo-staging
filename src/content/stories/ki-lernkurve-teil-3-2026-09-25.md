---
title: "KI-Lernkurve, Teil 3: Die GPS-Saga (und andere Bruchlandungen)"
description: Wochenlang gegen das eigene GPS-Signal gekämpft, einen Kopierschutz gebaut, der mich selbst sabotierte, und Exporte, die lautlos verschwanden. Warum hartnäckige Bugs oft auf das falsche Fundament zeigen.
date: 2026-09-25
cover: ../../assets/images/stories/ki-lernkurve.jpg
coverAlt: "Tastatur und Maus auf einem Mauspad mit einer schwarzen Katze mit großen Augen"
category: randnotizen
---
Bisher klang meine Geschichte fast zu glatt. Zeit, das geradezurücken: Meine eigene Wander-App zu bauen war der mit Abstand härteste Teil der Reise — und ich hab dabei mehr falsch gemacht, als mir lieb war.

## Mein GPS wollte einfach nicht funktionieren

Die App sollte simpel sein: loslaufen, Route aufzeichnen, fertig. Stattdessen hab ich Wochen mit meinem eigenen GPS-Signal gekämpft. Erst zeichnete die Route krumme Linien statt echter Wege auf. Dann fror die Positionsabfrage komplett ein, sobald das Handy-Display gesperrt war — die App merkte nichts davon, bis der Test vorbei war und die Strecke aussah wie mit dem Lineal gezogen.

Ich hab einen stillen Audio-Loop eingebaut, der das Handy künstlich wachhalten sollte. Hat eine Weile geholfen — und wurde später komplett wieder rausgeworfen, weil sich rausstellte: Das war nur ein Pflaster auf der eigentlichen Wunde.

## Als mein eigener Kopierschutz mich selbst sabotierte

Ich hatte einen Schutzmechanismus eingebaut, der Distanzen verfälschen sollte, falls jemand die App unerlaubt kopiert. Klang clever — bis er anfing, sich selbst gegen mich zu wenden: Auf meinem eigenen Heim-WLAN löste der Schutz fälschlich aus. Distanzen wurden gestutzt, Umlaute verschlüsselt, GPS-Rauschen künstlich reingemischt. Ich hatte quasi meine eigene Alarmanlage gebaut — und bin selbst reingelaufen.

## Wenn Dateien einfach nicht vom Handy wollten

Und dann die Sache mit dem Export: Fotos und Berichte ließen sich zwar erstellen, aber nicht vom Handy runterladen — die Downloads verschwanden lautlos im Nichts. Erst der Umstieg auf die native „Teilen“-Funktion des Handys (dieselbe, die du auch beim WhatsApp-Teilen nutzt) hat das Problem endgültig gelöst.

## Warum das wichtig ist

Rückblickend war fast keines dieser Probleme ein simpler Tippfehler. Es waren alles Symptome einer tieferen Frage: Baut man auf der richtigen Grundlage? Die GPS-Probleme etwa lösten sich erst dauerhaft, als klar wurde, dass eine Website im Browser gewisse Dinge auf dem Handy einfach nicht kann — egal wie viele Pflaster man draufklebt.

**Die Erkenntnis:** Die meisten hartnäckigen „Bugs“ sind keine Einzelfehler, sondern ein Zeichen dafür, dass die Grundlage nicht stimmt. Wenn du dasselbe Problem immer wieder mit neuen Pflastern reparierst, lohnt sich die Frage: Ist das Fundament überhaupt das richtige?

Nächste Folge: Der radikale Schnitt, der aus einer Browser-Seite endlich eine echte App gemacht hat — und der Moment, in dem alles plötzlich funktionierte.
