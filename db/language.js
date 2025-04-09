import { getLocales } from 'expo-localization';

export const korContext = {
  BTN_ACCEPT: '확인',
  BTN_DELETE: '삭제',
  BTN_DELETE_IN: '정말 삭제하시겠습니까?',
  BTN_CONSUME: '섭취',
  BTN_CONSUME_FIN: '섭취 완료',
  BTN_POST: '미룸',
  CHATBOT_FIRSTMSG: '무엇이든 물어보세요!',
  CHATBOT_SEND_IN: '메시지를 입력하세요...',
  CHATBOT_NAME: '챗봇',
  CHATBOT_SEND: '전송',
  ALARM_TITLE: '알림',
  ALARM_CONTENT_1: '재고가 저장되었습니다',
  ALARM_CONTENT_2: '아직 약 정보가 없습니다',
  ALARM_CONTENT_3: '약 정보가 DB에 없습니다',
  ALARM_CONTENT_4: '사진이 등록되어있지 않습니다',
  ALARM_CONTENT_5: '카메라 권한이 필요합니다',
  ALARM_CONTENT_6: '저장 중 오류 발생',
  BAB_OVER: '요약',
  BAB_LIST: '약 목록',
  BAB_EXP: '폐기',
  ADD_PILL: '약 추가',
  ADD_PILL_DETAIL: '약 세부정보 추가',
  ADD_PILL_TITLE: '약 정보 검색',
  SEARCH_PILL: '약 이름...',
  BTN_SEARCH: '검색',
  BTN_IMAGE_SEARCH: '이미지로 검색',
  SELF_ADD: '수동으로 추가하기',
  ELEMENT_AMT: '수량: ',
  ELEMENT_EXP: '유통기한: ',
  ELEMENT_TIME: '복용 시간: ',
  ELEMENT_CNT: '복용 개수: ',
  ELEMENT_NAME: '커스텀 약',
  INFO_NUM: '등록번호: ',
  INFO_CMP: '제조사: ',
  INFO_EFF: '효능: ',
  DETAIL_NAME: '약 이름',
  DETAIL_IMG: '사진 등록하기',
  DETAIL_PACK: '시중 판매 단위',
  DETAIL_PACK_IN: '결과 없음',
  DETAIL_PACK_AMT_1: '수량1',
  DETAIL_PACK_AMT_2: '수량2',
  DETAIL_PACK_UNIT_1: '단위1',
  DETAIL_PACK_UNIT_2: '단위2',
  DETAIL_AMT: '재고 수량',
  DETAIL_EXP: '유통기한',
  DETAIL_PLAN: '복용 일정',
  DETAIL_SAVE: '저장',
  DETAIL_BACK: '취소',
  DETAIL_NAME_IN: '약 이름',
  DETAIL_AMT_IN: '수량을 입력',
  DETAIL_EXP_IN: '유통기한 선택',
  DETAIL_PLAN_IN: '복용 일정 상세 설정',
  DETAIL_PLAN_NUM: '회',
  PLAN_NUM: '시간 ',
  PLAN_TIME: '설정',
  PLAN_FOOD_BEF: '식전',
  PLAN_FOOD_MID: '식중',
  PLAN_FOOD_AFT: '식후',
  PLAN_TERM_DAY: '매일',
  PLAN_TERM_WEEK: '매주',
  PLAN_TERM_WEEK_MON: '월',
  PLAN_TERM_WEEK_TUE: '화',
  PLAN_TERM_WEEK_WED: '수',
  PLAN_TERM_WEEK_THU: '목',
  PLAN_TERM_WEEK_FRI: '금',
  PLAN_TERM_WEEK_SAT: '토',
  PLAN_TERM_WEEK_SUN: '일',
  OVERVIEW_EMPTY: '해당 날짜에 복용 예정인 약이 없습니다.',
  PLAN_TERM_TWEEK: '격주',
  PLAN_TERM_INT: 'n일마다',
  PLAN_TERM_INT_INFO: '간격(일): ',
  PLAN_TERM_INT_IN: '예: 3',
  TITLE_OVER: '복용 관리',
  TITLE_LIST: '등록 현황',
  TITLE_EXP: '폐기 방법 / 목록 / 위치',
  SORT_METHOD_1: '즐겨찾기',
  SORT_METHOD_2: '이름',
  SORT_METHOD_3: '수량',
  SORT_METHOD_4: '유통기한',
  NOTIFER_TITLE: '약물 복용 알림',
  NOTIFER_TITLE_2: ' 복용 시간입니다',
  NOTIFER_UNIT: '개',
  NOTIFER_TITLE_3: '복용 알림(미룸)',
  FORM_HARD_TITLE: '고형의약품',
  FORM_1: '분말',
  FORM_2: '혼합정',
  FORM_3: '정제',
  FORM_LIQUID_TITLE: '액상 및 연고',
  FORM_4: '액상 및 시럽',
  FORM_5: '연고 및 크림',
  FORM_SPECIAL_TITLE: '특수의약품',
  FORM_6: '패치',
  FORM_7: '흡입기',
  FORM_8: '주사기',
  DISPOSAL_METHOD_IN: '그룹과 제형을 선택하면 폐기 방법이 표시됩니다.',
  DISPOSAL_METHOD_1_DIS: `[폐의약품수거함 사용 시]
개봉 전:
1. 약 봉투의 밀봉 상태를 유지한 채, 포장을 개봉하지 않고 바로 수거함에 넣습니다.
개봉 후:
1. 남은 분말을 내용물 상태를 확인한 후 전용 밀폐 봉투에 옮겨 담습니다.
2. 봉투에 사용 날짜와 "사용된 의약품" 라벨을 부착하고, 봉투 외부를 소독제로 닦습니다.
3. 이후 봉투를 폐의약품수거함에 투입합니다.`,
  DISPOSAL_METHOD_1_NONDIS: `[폐의약품수거함 미사용 시]
1. 약 봉투에서 분말을 조심스럽게 분리합니다.
2. 분말을 깨끗하고 밀봉 가능한 플라스틱 백에 옮겨 담습니다.
3. 필요 시, 흡수성 재료(예: 종이 타월)를 이용해 습기를 제거합니다.
4. 백을 단단히 밀봉한 후, 견고한 용기에 넣어 외부 충격으로부터 보호합니다.
5. 이후 해당 지역의 폐기 규정을 참고하여 적절히 폐기합니다.`,
  DISPOSAL_METHOD_2_DIS: `[폐의약품수거함 사용 시]
개봉 전:
1. 포장을 개봉하지 않은 상태 그대로 폐의약품수거함에 넣습니다.
개봉 후:
1. 남은 혼합정을 확인한 후 전용 밀폐 봉투에 담습니다.
2. 봉투에 사용 날짜와 라벨을 부착하고 외부를 소독제로 닦은 후 수거함에 투입합니다.`,
  DISPOSAL_METHOD_2_NONDIS: `[폐의약품수거함 미사용 시]
1. 포장을 개봉하여 남은 약물을 조심스럽게 분리합니다.
2. 약물 조각을 깨끗한 밀봉 가능한 플라스틱 백에 옮겨 담습니다.
3. 보호를 위해 백을 이중으로 감싸고 내부에 버블 랩 또는 종이 등의 완충재를 넣습니다.
4. 백을 단단히 밀봉한 후 "의약품 폐기" 라벨과 날짜를 기재합니다.
5. 이후 견고한 용기에 넣어 안전하게 보관하거나 해당 지역의 폐기 규정을 참고하여 폐기합니다.`,
  DISPOSAL_METHOD_3_DIS: `[폐의약품수거함 사용 시]
개봉 전:
1. 기존 포장 상태를 그대로 유지하며 수거함에 투입합니다.
개봉 후:
1. 약물을 제거한 후, 남은 정제를 원래 기존 포장에 재배치할 수 있으면 재포장합니다.
2. 재포장된 팩을 접착 테이프로 봉인하여 수거함에 넣습니다.`,
  DISPOSAL_METHOD_3_NONDIS: `[폐의약품수거함 미사용 시]
1. 포장을 개봉한 후 남은 정제들을 분리합니다.
2. 각 정제와 포장을 깨끗한 밀봉가능한 플라스틱 백에 넣습니다.
3. 백 내부에 흡수성 재료를 추가해 습기를 제거합니다.
4. 백을 단단히 밀봉하고 "의약품 폐기" 라벨과 사용 날짜를 기재합니다.
5. 견고한 용기에 넣어 외부 충격에 대비하여 보관하거나 해당 지역의 폐기 규정을 참고하여 폐기합니다.`,
  DISPOSAL_METHOD_4_DIS: `[폐의약품수거함 사용 시]
개봉 전:
1. 용기가 완전 밀봉되고 원래 라벨이 부착된 상태라면 그대로 수거함에 넣습니다.
개봉 후:
1. 용기 내 잔여액을 완전히 비우고, 깨끗한 물로 내부를 헹굽니다.
2. 용기를 완전히 건조시킨 후 밀폐 캡을 다시 부착하여 수거함에 투입합니다.`,
  DISPOSAL_METHOD_4_NONDIS: `[폐의약품수거함 미사용 시]
1. 용기 내 잔여 약품을 완전히 비웁니다.
2. 깨끗한 물로 내부를 헹구어 모든 잔여물을 제거합니다.
3. 내부가 완전히 건조되도록 둔 후, 밀봉 가능한 플라스틱 백에 넣습니다.
4. 백을 단단히 밀봉하고 "의약품 폐기" 및 날짜를 표기합니다.
5. 마지막 단계로 견고한 용기에 넣어 보관하거나 해당 지역의 폐기 규정을 참고하여 폐기합니다.`,
  DISPOSAL_METHOD_5_DIS: `[폐의약품수거함 사용 시]
개봉 전:
1. 원래 포장을 그대로 유지하며 수거함에 넣습니다.
개봉 후:
1. 용기에 남은 연고 또는 크림의 양과 상태를 확인합니다.
2. 내용물이 누출되지 않도록 용기를 단단히 밀봉하고, 외부를 소독한 후 수거함에 투입합니다.`,
  DISPOSAL_METHOD_5_NONDIS: `[폐의약품수거함 미사용 시]
1. 용기에서 남은 연고나 크림을 깨끗한 주걱 등으로 완전히 제거합니다.
2. 용기를 따뜻한 물과 순한 세제로 세척하여 모든 잔여물을 제거합니다.
3. 세척 후 용기를 완전히 건조시킵니다.
4. 건조된 용기를 깨끗한 흡수재(예: 종이 타월)로 감싼 후 밀봉 가능한 플라스틱 백에 넣습니다.
5. 백을 단단히 밀봉하고 "의약품 폐기" 및 날짜를 기재합니다.
6. 마지막으로 견고한 용기에 넣어 안전하게 보관하거나 해당 지역의 폐기 규정을 참고하여 폐기합니다.`,
  DISPOSAL_METHOD_6_DIS: `[폐의약품수거함 사용 시]
개봉 전:
1. 패치가 포함된 원래 포장을 개봉하지 않은 상태 그대로 수거함에 투입합니다.
개봉 후:
1. 패치를 꺼낸 후 접착면의 잔여물을 깨끗한 천으로 닦아냅니다.
2. 패치를 건조시킨 후 전용 밀폐 봉투에 넣어 수거함에 투입합니다.`,
  DISPOSAL_METHOD_6_NONDIS: `[폐의약품수거함 미사용 시]
1. 패치를 포장에서 꺼낸 후 깨끗한 티슈로 접착면의 잔여물을 꼼꼼히 제거합니다.
2. 필요 시 소량의 물로 헹군 후 자연 건조시킵니다.
3. 건조된 패치를 작은 밀봉 가능한 플라스틱 파우치에 넣고 단단히 밀봉합니다.
4. 파우치에 "의약품 폐기" 및 날짜를 표기한 후 견고한 용기에 보관하거나 해당 지역의 폐기 규정을 참고하여 폐기합니다.`,
  DISPOSAL_METHOD_7_DIS: `[폐의약품수거함 사용 시]
개봉 전:
1. 흡입기의 외부 포장을 그대로 유지하며 수거함에 넣습니다.
개봉 후:
1. 남은 약물과 기계 부품을 신중하게 분리합니다.
2. 분리된 약물은 전용 밀폐 용기에 담고, 기계 부품은 세척 후 소독하여 각각 수거함에 넣습니다.`,
  DISPOSAL_METHOD_7_NONDIS: `[폐의약품수거함 미사용 시]
1. 흡입기를 분해하여 약물과 부품을 완전히 분리합니다.
2. 남은 약물은 소량의 밀폐 용기에 옮겨 담고, 용기 외부를 소독합니다.
3. 부품은 부드러운 브러시와 천으로 잔여 약물을 제거한 후 완전히 건조시킵니다.
4. 각각의 약물 용기와 부품을 별도의 밀봉 가능한 플라스틱 백에 넣고 단단히 밀봉합니다.
5. 각 백에 "의약품 폐기" 및 날짜를 명기한 후 견고한 용기에 보관하거나 해당 지역의 폐기 규정을 참고하여 폐기합니다.`,
  DISPOSAL_METHOD_8_DIS: `[폐의약품수거함 사용 시]
사용 후:
1. 주사기를 일반 쓰레기에 버리지 않고 즉시 안전 커버를 씌워 날카로운 부분을 차단합니다.
2. 주사기 전용 수거함에 넣어 폐의약품수거절차에 따릅니다.`,
  DISPOSAL_METHOD_8_NONDIS: `[폐의약품수거함 미사용 시]
1. 사용 후 주사기를 조심스럽게 분리합니다.
2. 내장된 안전 장치 또는 별도 안전 커버를 사용하여 바늘 부분을 완전히 차단합니다.
3. 구멍이 뚫리지 않도록 주사기를 내구성이 강한 용기에 넣고 내부에 보호재(예: 버블 랩)를 넣어 고정합니다.
4. 용기의 뚜껑을 단단히 밀봉한 후 외부에 "의료 폐기물: 주사기"와 날짜를 명기합니다.
5. 별도의 안전 폐기 컨테이너 혹은 수거함에 해당 지역의 폐기 규정을 참고하여 폐기합니다.`,
  EXP_LIST_TITLE: '유통기한 만료/수량 소진 약품',
  EXP_LIST_IN: '아무것도 없습니다.',
  MAP_TITLE: '서울시 내 의약품 폐기 지도',
};

export const engContext = {
  BTN_ACCEPT: 'Accept',
  BTN_DELETE: 'Delete',
  BTN_DELETE_IN: 'Would you like to delete?',
  BTN_CONSUME: 'take',
  BTN_CONSUME_FIN: 'intake completed',
  BTN_POST: 'postpone',
  CHATBOT_FIRSTMSG: 'Ask me anything!',
  CHATBOT_SEND_IN: 'Enter your message...',
  CHATBOT_NAME: 'Chatbot',
  CHATBOT_SEND: 'Send',
  BAB_OVER: 'Summary',
  BAB_LIST: 'Drug List',
  BAB_EXP: 'Disposal',
  ADD_PILL: 'Add Drug',
  ADD_PILL_DETAIL: 'Add drug detail',
  ADD_PILL_TITLE: 'Search Drug Information',
  SEARCH_PILL: 'Drug Name...',
  BTN_SEARCH: 'Search',
  BTN_IMAGE_SEARCH: 'Image Search',
  SELF_ADD: 'Add Manually',
  ALARM_TITLE: 'Alert',
  ALARM_CONTENT_1: 'the med is saved',
  ALARM_CONTENT_2: 'Lack of required med info',
  ALARM_CONTENT_3: 'Med info is not in DB',
  ALARM_CONTENT_4: 'No photo registered',
  ALARM_CONTENT_5: 'Need camera authority',
  ALARM_CONTENT_6: 'Error occurred during process',
  ELEMENT_AMT: 'Quantity: ',
  ELEMENT_EXP: 'Expiration Date: ',
  ELEMENT_TIME: 'Intake Time: ',
  ELEMENT_CNT: 'Dose Count: ',
  ELEMENT_NAME: 'Custom Med',
  INFO_NUM: 'Registration No.: ',
  INFO_CMP: 'Manufacturer: ',
  INFO_EFF: 'Effectiveness: ',
  DETAIL_NAME: 'Drug Name',
  DETAIL_IMG: 'Register Image',
  DETAIL_PACK: 'Pack Unit',
  DETAIL_PACK_IN: 'No result',
  DETAIL_PACK_AMT_1: 'quantity1',
  DETAIL_PACK_AMT_2: 'quantity2',
  DETAIL_PACK_UNIT_1: 'unit1',
  DETAIL_PACK_UNIT_2: 'unit2',
  DETAIL_AMT: 'Stock Amount',
  DETAIL_EXP: 'Expiration Date',
  DETAIL_PLAN: 'Intake Schedule',
  DETAIL_SAVE: 'Save',
  DETAIL_BACK: 'Cancel',
  DETAIL_NAME_IN: 'Drug Name',
  DETAIL_AMT_IN: 'Enter Quantity',
  DETAIL_EXP_IN: 'Select Expiration Date',
  DETAIL_PLAN_IN: 'Set Detailed Schedule',
  DETAIL_PLAN_NUM: ' time',
  PLAN_NUM: 'Time ',
  PLAN_TIME: 'setting',
  PLAN_FOOD_BEF: 'Before Meal',
  PLAN_FOOD_MID: 'During Meal',
  PLAN_FOOD_AFT: 'After Meal',
  PLAN_TERM_DAY: 'Daily',
  PLAN_TERM_WEEK: 'Weekly',
  PLAN_TERM_WEEK_MON: 'Mon',
  PLAN_TERM_WEEK_TUE: 'Tue',
  PLAN_TERM_WEEK_WED: 'Wed',
  PLAN_TERM_WEEK_THU: 'Thu',
  PLAN_TERM_WEEK_FRI: 'Fri',
  PLAN_TERM_WEEK_SAT: 'Sat',
  PLAN_TERM_WEEK_SUN: 'Sun',
  PLAN_TERM_TWEEK: 'Biweekly',
  PLAN_TERM_INT: 'Every n Days',
  PLAN_TERM_INT_INFO: 'Interval (Days): ',
  PLAN_TERM_INT_IN: 'e.g.: 3',
  TITLE_OVER: 'Intake Management',
  TITLE_LIST: 'Registration Status',
  TITLE_EXP: 'Disposal Method / List / Location',
  SORT_METHOD_1: 'Favorite',
  SORT_METHOD_2: 'Name',
  SORT_METHOD_3: 'Quantity',
  SORT_METHOD_4: 'Expiration Date',
  NOTIFER_TITLE: 'Medication Reminder',
  NOTIFER_TITLE_2: ` It's time to take your medicine`,
  NOTIFER_UNIT: '',
  NOTIFER_TITLE_3: 'Dosage Reminder (Postponed)',
  FORM_HARD_TITLE: 'Solid Drugs',
  FORM_1: 'Powder',
  FORM_2: 'Mixed Tablet',
  FORM_3: 'Tablet',
  FORM_LIQUID_TITLE: 'Liquids & Ointments',
  FORM_4: 'Liquid & Syrup',
  FORM_5: 'Ointment & Cream',
  FORM_SPECIAL_TITLE: 'Special Drugs',
  FORM_6: 'Patch',
  FORM_7: 'Inhaler',
  FORM_8: 'Syringe',
  DISPOSAL_METHOD_IN: 'When you select a group and form, the disposal method will be displayed.',
  DISPOSAL_METHOD_1_DIS: `[When using a drug disposal box]
Before opening:
1. Without opening the package, keep the drug bag sealed and place it directly into the disposal box.
After opening:
1. Check the condition of the remaining powder and transfer it into a designated airtight bag.
2. Affix the usage date and a label "Used Drug" to the bag, and wipe the outside with disinfectant.
3. Then, insert the bag into the drug disposal box.`,
  DISPOSAL_METHOD_1_NONDIS: `[When not using a drug disposal box]
1. Carefully separate the powder from the drug bag.
2. Transfer the powder into a clean, sealable plastic bag.
3. If necessary, remove moisture using an absorbent material (e.g., paper towel).
4. Seal the bag tightly and place it in a sturdy container to protect it from external impacts.
5. Then, dispose of it according to local disposal regulations.`,
  DISPOSAL_METHOD_2_DIS: `[When using a drug disposal box]
Before opening:
1. Without opening the package, place it directly into the disposal box.
After opening:
1. Check the remaining mixed tablet and transfer it into a designated airtight bag.
2. Affix the usage date and label to the bag, wipe the outside with disinfectant, and then insert it into the disposal box.`,
  DISPOSAL_METHOD_2_NONDIS: `[When not using a drug disposal box]
1. Open the package and carefully separate the remaining drug.
2. Transfer the drug fragments into a clean, sealable plastic bag.
3. For protection, wrap the bag in an extra layer and add cushioning material (e.g., bubble wrap or paper).
4. Seal the bag tightly and label it "Drug Disposal" with the date.
5. Finally, place it in a sturdy container for safe storage or dispose of it according to local regulations.`,
  DISPOSAL_METHOD_3_DIS: `[When using a drug disposal box]
Before opening:
1. Maintain the original packaging and insert it into the disposal box.
After opening:
1. Remove the drug and, if possible, repackage the remaining tablets into the original package.
2. Seal the repackaged pack with adhesive tape and put it into the disposal box.`,
  DISPOSAL_METHOD_3_NONDIS: `[When not using a drug disposal box]
1. Open the package and separate the remaining tablets.
2. Place each tablet and its packaging into a clean, sealable plastic bag.
3. Add absorbent material inside the bag to remove moisture.
4. Seal the bag tightly and label it "Drug Disposal" with the usage date.
5. Finally, place it in a sturdy container for safe storage or dispose of it according to local regulations.`,
  DISPOSAL_METHOD_4_DIS: `[When using a drug disposal box]
Before opening:
1. If the container is completely sealed with its original label, place it directly into the disposal box.
After opening:
1. Completely empty the container of any remaining contents and rinse the inside with clean water.
2. Once the container is fully dry, reattach the sealed cap and insert it into the disposal box.`,
  DISPOSAL_METHOD_4_NONDIS: `[When not using a drug disposal box]
1. Completely empty the container of any remaining drug.
2. Rinse the inside thoroughly with clean water to remove all residues.
3. Allow the container to dry completely, then place it into a sealable plastic bag.
4. Seal the bag tightly and label it "Drug Disposal" with the date.
5. Finally, place it in a sturdy container for safe storage or dispose of it according to local regulations.`,
  DISPOSAL_METHOD_5_DIS: `[When using a drug disposal box]
Before opening:
1. Maintain the original packaging and insert it into the disposal box.
After opening:
1. Check the amount and condition of any remaining ointment or cream in the container.
2. Seal the container tightly to prevent leakage, disinfect the exterior, and then insert it into the disposal box.`,
  DISPOSAL_METHOD_5_NONDIS: `[When not using a drug disposal box]
1. Remove any remaining ointment or cream from the container using a clean spatula.
2. Wash the container thoroughly with warm water and mild detergent to remove all residue.
3. Allow the container to dry completely.
4. Wrap the dried container with clean absorbent material (e.g., paper towel) and place it into a sealable plastic bag.
5. Seal the bag tightly and label it "Drug Disposal" with the date.
6. Finally, place it in a sturdy container for safe storage or dispose of it according to local regulations.`,
  DISPOSAL_METHOD_6_DIS: `[When using a drug disposal box]
Before opening:
1. Without opening the original packaging that contains the patch, insert it directly into the disposal box.
After opening:
1. Remove the patch and wipe off any residue on the adhesive surface with a clean cloth.
2. Once dry, place the patch into a designated airtight bag and insert it into the disposal box.`,
  DISPOSAL_METHOD_6_NONDIS: `[When not using a drug disposal box]
1. Remove the patch from its packaging and carefully clean the adhesive surface with a clean tissue.
2. If necessary, rinse lightly with water and allow it to air dry.
3. Once dry, place the patch into a small sealable plastic pouch and seal it tightly.
4. Label the pouch with "Drug Disposal" and the date, then store it in a sturdy container or dispose of it according to local regulations.`,
  DISPOSAL_METHOD_7_DIS: `[When using a drug disposal box]
Before opening:
1. Maintain the external packaging of the inhaler and place it into the disposal box.
After opening:
1. Carefully separate any remaining drug and mechanical components.
2. Place the separated drug into a designated airtight container, and after cleaning and disinfecting the mechanical components, insert them into the disposal box separately.`,
  DISPOSAL_METHOD_7_NONDIS: `[When not using a drug disposal box]
1. Disassemble the inhaler to completely separate the drug and its components.
2. Transfer the remaining drug into a small airtight container and disinfect the container's exterior.
3. Clean the components with a soft brush and cloth to remove any drug residue, and allow them to dry completely.
4. Place each drug container and the components into separate sealable plastic bags and seal them tightly.
5. Label each bag with "Drug Disposal" and the date, then store them in a sturdy container or dispose of them according to local regulations.`,
  DISPOSAL_METHOD_8_DIS: `[When using a drug disposal box]
After use:
1. Do not dispose of the syringe in regular trash; immediately cover it with a safety cover to block the sharp end.
2. Place the syringe into a designated syringe disposal container following proper procedures.`,
  DISPOSAL_METHOD_8_NONDIS: `[When not using a drug disposal box]
1. Carefully separate the syringe after use.
2. Use the built-in safety mechanism or a separate safety cover to completely cover the needle.
3. Place the syringe into a durable container with protective material (e.g., bubble wrap) to prevent punctures.
4. Seal the container tightly and label it "Medical Waste: Syringe" along with the date.
5. Finally, dispose of it in a designated safety disposal container or according to local disposal regulations.`,
  EXP_LIST_TITLE: 'Expired/Low Stock Drugs',
  EXP_LIST_IN: 'Nothing to display.',
  MAP_TITLE: 'Drug Disposal Map in Seoul',
};

export const localeAuto = () => {
  const { languageCode } = getLocales()[0];
  if (languageCode === 'ko') return korContext;
  if (languageCode === 'en') return engContext;
  else return korContext;
};

export const context = localeAuto();
