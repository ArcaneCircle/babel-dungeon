#!/usr/bin/env python3
import os
import sys


def sort(sentences: dict[str, int]) -> list[int, str]:
    return sorted((s[1], s[0]) for s in sentences.items())


def sort0(pair: tuple[int, str]) -> int:
    words_count = len(pair[1].split())
    if words_count <= 2:
        return 1
    return words_count


def sort1(pair: tuple[int, str]) -> int:
    words_count = len(pair[1].split())
    if words_count <= 3:
        return 1
    return words_count


def sort2(pair: tuple[int, str]) -> int:
    words_count = len(pair[1].split())
    if words_count <= 5:
        return 1
    return words_count


def sort3(pair: tuple[int, str]) -> int:
    words_count = len(pair[1].split())
    if words_count <= 5:
        return 1
    if words_count <= 10:
        return 2
    return words_count


def main() -> None:
    source = [each for each in os.listdir() if each.endswith(".tsv")][0]
    dest = "src/lib/sentences.ts"

    args = sys.argv[1:]
    if len(args) == 3 and args[0] == "generate":
        start = int(args[1])
        count = int(args[2])
    else:
        start = 0
        count = 50000

    sentences: dict[str, int] = {}
    sentences_ids: set[int] = set()  # for counting duplicates
    sent2mean: dict[str, list[str]] = {}
    meanings: dict[str, int] = {}
    meanings_ids: set[int] = set()  # for counting duplicates
    with open(source) as fd:
        for line in fd.readlines():
            row = line.strip().split("\t")
            id = int(row[0])
            sentences_ids.add(id)
            sentence = row[1]
            if sentences.get(sentence, id + 1) > id:
                sentences[sentence] = id
            mlist = sent2mean.setdefault(sentence, [])
            meaning = row[3]
            if meaning not in mlist:
                mlist.append(meaning)
            mid = int(row[2])
            meanings_ids.add(mid)
            if meanings.get(meaning, mid + 1) > mid:
                meanings[meaning] = mid

    error = False
    print(f"TOTAL SENTENCES: {len(sentences_ids)}")
    print(f"UNIQUE SENTENCES: {len(sentences)}")
    for sentence, id in sentences.items():
        if id not in sentences_ids:
            print(id, ":", sentence)
            error = True
        else:
            sentences_ids.remove(id)
    print("")
    print(f"TOTAL MEANINGS: {len(meanings_ids)}")
    print(f"UNIQUE MEANINGS: {len(meanings)}")
    for meaning, id in meanings.items():
        if id not in meanings_ids:
            print(id, ":", meaning)
            error = True
        else:
            meanings_ids.remove(id)
    print("")
    if error:
        print("ERROR")
        return

    count = min(len(sentences), count)
    new_sents = []
    items = sorted(sort(sentences), key=sort0)
    for id, sen in list(items)[:100]:
        new_sents.append((id, sen))
        del sentences[sen]
    items = sorted(sort(sentences), key=sort1)
    for id, sen in list(items)[:500]:
        new_sents.append((id, sen))
        del sentences[sen]
    items = sorted(sort(sentences), key=sort2)
    for id, sen in list(items)[:10000]:
        new_sents.append((id, sen))
        del sentences[sen]
    items = sorted(sort(sentences), key=sort3)
    for id, sen in list(items):
        new_sents.append((id, sen))
        del sentences[sen]

    if len(sys.argv) == 2 and sys.argv[1] == "sort":
        with open(source, "w") as f:
            for id, sen in new_sents:
                for meaning in sent2mean[sen]:
                    mid = meanings[meaning]
                    f.write(f"{id}\t{sen}\t{mid}\t{meaning}\n")
        print(f"sorted {len(new_sents)} sentences")
        return

    with open(dest, "w") as f:
        f.write("export const SENTENCES = `")
        count2 = 0
        for id, sen in new_sents[start:count]:
            count2 += 1
            f.write(f"{sen}\t{'|'.join(sent2mean[sen])}".replace("`", "\`"))
            if count2 != count:
                f.write("\n")
        f.write('`.split("\\n");\n')
    print(f"generated {count2} sentences")


if __name__ == "__main__":
    main()
