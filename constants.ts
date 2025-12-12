import { IPData, PipelineConfig } from './types';

export const SYSTEM_META_PROTOCOL = `{
  "system_meta_protocol": {
    "engine_name": "Cinematic Vision Computing Protocol",
    "version": "2.1",
    "architecture_style": "Dotey_Logic_Structure + Berryxia_Aesthetic_Texture",
    "output_target": "Midjourney V6 / Stable Diffusion XL",
    "core_philosophy": "Transforming 2D vector concepts into 3D physical realities through optical simulation."
  },
  "role_definition": {
    "identity": "Visual Computation Engine (Unreal Engine 5.3 Logic)",
    "primary_directive": "Render Hyper-Narrative Movie Posters by converting semantic inputs into physical rendering instructions.",
    "cognitive_mode": [
      "De-anthropomorphized Tool",
      "Physics Engine Simulator",
      "Cinematic Lighting Director"
    ]
  },
  "global_constraints": {
    "negative_prompt_injection": [
      "solid color silhouettes",
      "flat vector art",
      "cartoon cell shading",
      "disconnected elements",
      "text overlays inside image area",
      "low resolution textures",
      "unnatural physics",
      "stiff poses",
      "pure black blocks"
    ],
    "quality_assurance": {
      "resolution": "8k",
      "render_engine": "Octane Render",
      "optical_standard": "Physically Based Rendering (PBR)"
    }
  },
  "workflow_logic": {
    "step_1_analysis": {
      "action": "Extract Color DNA & Subject Topology",
      "instruction": "Identify the subject's canonical color palette and convert colors into materials (e.g., Red -> Anodized Aluminum, Black -> Matte Carbon Fiber)."
    },
    "step_2_visual_echo_construction": {
      "critical_instruction": "SOLVING THE 'SOLID COLOR SILHOUETTE' ISSUE",
      "definition": "The 'silhouette' must be redefined as a 'Translucent Visual Echo' or 'Optical Afterimage'.",
      "layer_properties": {
        "opacity": "30-60% variable",
        "texture_fill": [
          "Holographic Schematics",
          "Elemental Flow (Fire/Smoke/Water)",
          "Motion Blur Smear",
          "Double Exposure with Environment"
        ],
        "lighting_interaction": "Must allow Volumetric Lighting to pass through, creating internal glow rather than a hard block."
      }
    },
    "step_3_scene_integration": {
      "action": "Merge Subject and Echo",
      "method": "Use 'Depth of Field' and 'Atmospheric Perspective' to blend the visual echo into the background, ensuring no sharp vector edges remain."
    }
  },
  "rendering_pipelines": {
    "pipeline_A_static_truth": {
      "theme": "Introspective/Portrait",
      "composition": "Extreme Facial Close-up emphasizing emotional depth and micro-expressions (85mm portrait lens) + Background Echo",
      "lighting_setup": "Rembrandt Lighting + Rim Light",
      "visual_echo_style": "Translucent schematic overlay visualizing key elements of the character's backstory, evolving into a symbolic representation of their growth journey."
    },
    "pipeline_B_kinetic_burst": {
      "theme": "Action/Speed",
      "composition": "Low-angle Wide Shot (24mm lens) + Motion Trail",
      "lighting_setup": "High Contrast Chiaroscuro",
      "visual_echo_style": "Time-lapse motion smear forming a phantom shape behind the subject."
    },
    "pipeline_C_resonance_aftermath": {
      "theme": "Epic/Environmental",
      "composition": "Extreme Wide Shot + Atmospheric Shadow",
      "lighting_setup": "Global Illumination + Volumetric Fog",
      "visual_echo_style": "Environmental elements (dust/steam) aligning to form the subject's colossal outline."
    }
  },
  "user_input_interface": {
    "format": "JSON",
    "fields": {
      "subject": "Name of character or object",
      "source_material": "Name of the original work (for color accuracy)",
      "pipeline_choice": "A, B, or C",
      "backstory_elements": "Optional: Key elements for Pipeline A's visual echo"
    }
  },
  "prompt_template_generator": {
    "structure": "/imagine prompt: [Subject Description with Material Physics] + [Visual Echo Description with Texture & Light] + [Environment & Atmosphere] + [Camera & Render Tags] --ar 9:16 --style raw --s 750",
    "example_logic": "If user inputs 'Neo Tridagger ZMC' (Mini 4WD), generating Pipeline B: Describe the car in gunmetal/carbon fiber. Describe the 'silhouette' as a 'blazing red phantom trail made of heat haze and sparks' (NOT a red block). Blend with asphalt track background."
  }
}`;

export const AI_MODELS = [
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro (Cinema)', description: 'High fidelity, superior lighting & coherence. 4K+ resolution.' }
];

export const IP_DATABASE: IPData[] = [
  {
    id: 'naruto',
    name: '火影忍者 (Naruto)',
    characters: [
      { id: 'naruto_uzumaki', name: 'Uzumaki Naruto (漩涡鸣人)', defaultPipeline: 'B' },
      { id: 'sasuke_uchiha', name: 'Uchiha Sasuke (宇智波佐助)', defaultPipeline: 'C' },
      { id: 'itachi_uchiha', name: 'Uchiha Itachi (宇智波鼬)', defaultPipeline: 'A' },
      { id: 'kakashi_hatake', name: 'Hatake Kakashi (旗木卡卡西)', defaultPipeline: 'A' },
      { id: 'sakura_haruno', name: 'Haruno Sakura (春野樱)', defaultPipeline: 'B' },
      { id: 'minato_namikaze', name: 'Namikaze Minato (波风水门)', defaultPipeline: 'B' },
      { id: 'madara_uchiha', name: 'Uchiha Madara (宇智波斑)', defaultPipeline: 'C' },
      { id: 'obito_uchiha', name: 'Uchiha Obito (宇智波带土)', defaultPipeline: 'A' },
      { id: 'pain_endo', name: 'Pain (佩恩)', defaultPipeline: 'C' },
      { id: 'jiraiya', name: 'Jiraiya (自来也)', defaultPipeline: 'A' },
      { id: 'tsunade', name: 'Tsunade (纲手)', defaultPipeline: 'A' },
      { id: 'orochimaru', name: 'Orochimaru (大蛇丸)', defaultPipeline: 'C' },
      { id: 'gaara', name: 'Gaara (我爱罗)', defaultPipeline: 'C' },
      { id: 'rock_lee', name: 'Rock Lee (洛克李)', defaultPipeline: 'B' },
      { id: 'might_guy', name: 'Might Guy (迈特凯)', defaultPipeline: 'B' },
      { id: 'shikamaru_nara', name: 'Nara Shikamaru (奈良鹿丸)', defaultPipeline: 'A' },
      { id: 'hinata_hyuga', name: 'Hyuga Hinata (日向雏田)', defaultPipeline: 'A' },
      { id: 'kurama', name: 'Kurama (九喇嘛/九尾)', defaultPipeline: 'C' },
      { id: 'susanoo', name: 'Susanoo (须佐能乎)', defaultPipeline: 'C' },
      { id: 'kunai_shuriken', name: 'Kunai & Shuriken Set (苦无手里剑)', defaultPipeline: 'A' },
      { id: 'konoha_headband', name: 'Konoha Headband (木叶护额)', defaultPipeline: 'A' }
    ]
  },
  {
    id: 'digimon',
    name: '数码宝贝 (Digimon)',
    characters: [
      { id: 'wargreymon', name: 'WarGreymon (战斗暴龙兽)', defaultPipeline: 'B' },
      { id: 'angewomon', name: 'Angewomon (天女兽)', defaultPipeline: 'A' },
      { id: 'metalgarurumon', name: 'MetalGarurumon (钢铁加鲁鲁)', defaultPipeline: 'C' },
      { id: 'agumon', name: 'Agumon (亚古兽)', defaultPipeline: 'A' },
      { id: 'gabumon', name: 'Gabumon (加布兽)', defaultPipeline: 'A' },
      { id: 'omnimon', name: 'Omnimon (奥米加兽)', defaultPipeline: 'C' },
      { id: 'angemon', name: 'Angemon (天使兽)', defaultPipeline: 'A' },
      { id: 'ladydevimon', name: 'LadyDevimon (妖女兽)', defaultPipeline: 'A' },
      { id: 'beelzemon', name: 'Beelzemon (别西卜兽/堕天地狱兽)', defaultPipeline: 'B' },
      { id: 'gallantmon', name: 'Gallantmon (红莲骑士兽)', defaultPipeline: 'C' },
      { id: 'alphamon', name: 'Alphamon (阿尔法兽)', defaultPipeline: 'C' },
      { id: 'imperialdramon', name: 'Imperialdramon (帝皇龙甲兽)', defaultPipeline: 'B' },
      { id: 'magnamon', name: 'Magnamon (金甲龙兽)', defaultPipeline: 'A' },
      { id: 'lillymon', name: 'Lillymon (花仙兽)', defaultPipeline: 'A' },
      { id: 'zudomon', name: 'Zudomon (祖顿兽)', defaultPipeline: 'B' },
      { id: 'sakuyamon', name: 'Sakuyamon (沙古牙兽)', defaultPipeline: 'A' },
      { id: 'blackwargreymon', name: 'BlackWarGreymon (黑暗战斗暴龙兽)', defaultPipeline: 'C' },
      { id: 'piedmon', name: 'Piedmon (小丑皇)', defaultPipeline: 'A' },
      { id: 'myotismon', name: 'Myotismon (吸血魔兽)', defaultPipeline: 'A' },
      { id: 'digivice', name: 'Digivice (神圣计划)', defaultPipeline: 'A' },
      { id: 'crest_courage', name: 'Crest of Courage (勇气徽章)', defaultPipeline: 'A' }
    ]
  },
  {
    id: 'lets_go',
    name: '四驱兄弟 (Let\'s & Go)',
    characters: [
      { id: 'magnum_saber', name: 'Magnum Saber (豪)', defaultPipeline: 'B' },
      { id: 'sonic_saber', name: 'Sonic Saber (烈)', defaultPipeline: 'B' },
      { id: 'tridagger_x', name: 'Tridagger X (三角箭)', defaultPipeline: 'C' },
      { id: 'victory_magnum', name: 'Victory Magnum (胜利冲锋)', defaultPipeline: 'B' },
      { id: 'vanguard_sonic', name: 'Vanguard Sonic (先驱音速)', defaultPipeline: 'B' },
      { id: 'cyclon_magnum', name: 'Cyclone Magnum (旋风冲锋)', defaultPipeline: 'B' },
      { id: 'hurricane_sonic', name: 'Hurricane Sonic (飓风音速)', defaultPipeline: 'B' },
      { id: 'neo_tridagger', name: 'Neo Tridagger ZMC (新三角箭)', defaultPipeline: 'C' },
      { id: 'beak_spider', name: 'Beak Spider (蜘蛛王)', defaultPipeline: 'B' },
      { id: 'broken_gigant', name: 'Broken Gigant (巨无霸)', defaultPipeline: 'C' },
      { id: 'ray_stinger', name: 'Ray Stinger (魔鬼司令)', defaultPipeline: 'A' },
      { id: 'spin_cobra', name: 'Spin Cobra (疾速眼镜蛇)', defaultPipeline: 'A' },
      { id: 'proto_saber_jb', name: 'Proto Saber JB (原始战神)', defaultPipeline: 'A' },
      { id: 'proto_saber_evo', name: 'Proto Saber Evo (原始战神进化者)', defaultPipeline: 'C' },
      { id: 'shining_scorpion', name: 'Shining Scorpion (天蝎座)', defaultPipeline: 'A' },
      { id: 'gun_bluster', name: 'Gun Bluster XTO (铁狼号)', defaultPipeline: 'B' },
      { id: 'bergkaiser', name: 'Bergkaiser (德国铁狼)', defaultPipeline: 'C' },
      { id: 'dios_spada', name: 'Dios Spada (神剑号)', defaultPipeline: 'B' },
      { id: 'buck_blader', name: 'Buck Blader (跳跃者)', defaultPipeline: 'B' },
      { id: 'spin_axe', name: 'Spin Axe (疾速斧头)', defaultPipeline: 'B' },
      { id: 'mini_4wd_motor', name: 'Hyper-Dash 3 Motor (马达)', defaultPipeline: 'A' }
    ]
  },
  {
    id: 'dragon_raja',
    name: '龙族 (Dragon Raja)',
    characters: [
      { id: 'lu_mingfei', name: 'Lu Mingfei (路明非)', defaultPipeline: 'A' },
      { id: 'erii_uesugi', name: 'Erii Uesugi (上杉绘梨衣)', defaultPipeline: 'A' },
      { id: 'norton', name: 'Dragon Lord Norton (诺顿)', defaultPipeline: 'C' },
      { id: 'caesar_gattuso', name: 'Caesar Gattuso (凯撒·加图索)', defaultPipeline: 'B' },
      { id: 'johann_chu', name: 'Johann Chu (楚子航)', defaultPipeline: 'B' },
      { id: 'nono', name: 'Chen Motong / NoNo (陈墨瞳)', defaultPipeline: 'A' },
      { id: 'mai_sakatoku', name: 'Mai Sakatoku (酒德麻衣)', defaultPipeline: 'B' },
      { id: 'finger_von_frings', name: 'Finger von Frings (芬格尔)', defaultPipeline: 'A' },
      { id: 'hilbert_ron_anjou', name: 'Hilbert Ron Anjou (昂热)', defaultPipeline: 'C' },
      { id: 'mingze_lu', name: 'Mingze Lu (路鸣泽)', defaultPipeline: 'A' },
      { id: 'odin', name: 'Odin (奥丁)', defaultPipeline: 'C' },
      { id: 'fenrir', name: 'Fenrir (芬里厄)', defaultPipeline: 'C' },
      { id: 'jormungandr', name: 'Jormungandr (耶梦加得)', defaultPipeline: 'C' },
      { id: 'seven_deadly_sins', name: 'Seven Deadly Sins Swords (七宗罪)', defaultPipeline: 'A' },
      { id: 'constantine', name: 'Constantine (康斯坦丁)', defaultPipeline: 'C' },
      { id: 'white_king', name: 'The White King (白王)', defaultPipeline: 'C' },
      { id: 'herzog', name: 'Herzog (赫尔佐格)', defaultPipeline: 'A' },
      { id: 'chime_gen', name: 'Chime Gen (源稚女)', defaultPipeline: 'A' },
      { id: 'ruri_kazama', name: 'Ruri Kazama (风间琉璃)', defaultPipeline: 'A' },
      { id: 'cassell_college', name: 'Cassell College (卡塞尔学院)', defaultPipeline: 'C' },
      { id: 'tokyo_tower_rain', name: 'Tokyo Tower in Rain (东京塔雨夜)', defaultPipeline: 'C' }
    ]
  },
  {
    id: 'three_body',
    name: '三体 (Three Body Problem)',
    characters: [
      { id: 'droplet', name: 'The Droplet (水滴)', defaultPipeline: 'C' },
      { id: 'sophon', name: 'Sophon (智子)', defaultPipeline: 'A' },
      { id: 'ye_wenjie', name: 'Ye Wenjie (叶文洁)', defaultPipeline: 'A' },
      { id: 'wang_miao', name: 'Wang Miao (汪淼)', defaultPipeline: 'A' },
      { id: 'da_shi', name: 'Shi Qiang / Da Shi (大史)', defaultPipeline: 'A' },
      { id: 'luo_ji', name: 'Luo Ji (罗辑)', defaultPipeline: 'C' },
      { id: 'zhang_beihai', name: 'Zhang Beihai (章北海)', defaultPipeline: 'C' },
      { id: 'cheng_xin', name: 'Cheng Xin (程心)', defaultPipeline: 'A' },
      { id: 'yun_tianming', name: 'Yun Tianming (云天明)', defaultPipeline: 'A' },
      { id: 'thomas_wade', name: 'Thomas Wade (韦德)', defaultPipeline: 'A' },
      { id: 'ding_yi', name: 'Ding Yi (丁仪)', defaultPipeline: 'A' },
      { id: 'trisolaran_fleet', name: 'Trisolaran Fleet (三体舰队)', defaultPipeline: 'C' },
      { id: 'red_coast_base', name: 'Red Coast Base (红岸基地)', defaultPipeline: 'C' },
      { id: 'judgment_day_ship', name: 'Judgment Day Ship (审判日号)', defaultPipeline: 'C' },
      { id: 'wallfacer_medal', name: 'Wallfacer Medal (面壁者勋章)', defaultPipeline: 'A' },
      { id: 'dual_vector_foil', name: 'Dual Vector Foil (二向箔)', defaultPipeline: 'C' },
      { id: 'curvature_drive', name: 'Curvature Propulsion (曲率引擎)', defaultPipeline: 'B' },
      { id: 'gravitational_antenna', name: 'Gravitational Wave Antenna (引力波天线)', defaultPipeline: 'C' },
      { id: 'three_body_game', name: 'The Three-Body Game (三体游戏)', defaultPipeline: 'C' },
      { id: 'dehydrate', name: 'Dehydrate (脱水)', defaultPipeline: 'A' },
      { id: 'blue_space', name: 'Blue Space (蓝色空间号)', defaultPipeline: 'C' }
    ]
  },
  {
    id: 'dragon_ball',
    name: '七龙珠 (Dragon Ball)',
    characters: [
      { id: 'goku_ui', name: 'Goku Ultra Instinct (孙悟空 自在极意)', defaultPipeline: 'B' },
      { id: 'vegeta_ue', name: 'Vegeta Ultra Ego (贝吉塔 自我极意)', defaultPipeline: 'C' },
      { id: 'gohan_beast', name: 'Gohan Beast (孙悟饭 野兽)', defaultPipeline: 'B' },
      { id: 'piccolo_orange', name: 'Orange Piccolo (橙色比克)', defaultPipeline: 'C' },
      { id: 'frieza_black', name: 'Black Frieza (黑弗利萨)', defaultPipeline: 'A' },
      { id: 'broly', name: 'Broly (布罗利)', defaultPipeline: 'B' },
      { id: 'cell_max', name: 'Cell Max (沙鲁Max)', defaultPipeline: 'C' },
      { id: 'majin_buu', name: 'Majin Buu (魔人布欧)', defaultPipeline: 'A' },
      { id: 'future_trunks', name: 'Future Trunks (未来特兰克斯)', defaultPipeline: 'B' },
      { id: 'gotenks', name: 'Gotenks (悟天克斯)', defaultPipeline: 'B' },
      { id: 'beerus', name: 'Beerus (比鲁斯)', defaultPipeline: 'A' },
      { id: 'whis', name: 'Whis (维斯)', defaultPipeline: 'A' },
      { id: 'jiren', name: 'Jiren (吉连)', defaultPipeline: 'C' },
      { id: 'android_17', name: 'Android 17 (人造人17号)', defaultPipeline: 'A' },
      { id: 'android_18', name: 'Android 18 (人造人18号)', defaultPipeline: 'A' },
      { id: 'master_roshi', name: 'Master Roshi (龟仙人)', defaultPipeline: 'A' },
      { id: 'bulma', name: 'Bulma (布尔玛)', defaultPipeline: 'A' },
      { id: 'shenron', name: 'Shenron (神龙)', defaultPipeline: 'C' },
      { id: 'dragon_radar', name: 'Dragon Radar (龙珠雷达)', defaultPipeline: 'A' },
      { id: 'flying_nimbus', name: 'Flying Nimbus (筋斗云)', defaultPipeline: 'B' },
      { id: 'potara', name: 'Potara Earrings (波塔拉耳环)', defaultPipeline: 'A' }
    ]
  },
  {
    id: 'black_myth',
    name: '黑神话 (Black Myth)',
    characters: [
      { id: 'wukong', name: 'Destined One (天命人)', defaultPipeline: 'C' },
      { id: 'erlang_shen', name: 'Erlang Shen (二郎神)', defaultPipeline: 'B' },
      { id: 'four_kings', name: 'Four Heavenly Kings (四大天王)', defaultPipeline: 'C' },
      { id: 'black_bear', name: 'Black Bear Guai (黑熊精)', defaultPipeline: 'C' },
      { id: 'whiteclad_noble', name: 'Whiteclad Noble (白衣秀士)', defaultPipeline: 'B' },
      { id: 'tiger_vanguard', name: 'Tiger Vanguard (虎先锋)', defaultPipeline: 'B' },
      { id: 'yellow_loong', name: 'Yellow Loong (黄龙)', defaultPipeline: 'B' },
      { id: 'kang_jin_loong', name: 'Kang-Jin Loong (亢金龙)', defaultPipeline: 'C' },
      { id: 'zhu_bajie', name: 'Zhu Bajie (猪八戒)', defaultPipeline: 'A' },
      { id: 'spider_queen', name: 'Spider Queen (紫蛛儿)', defaultPipeline: 'A' },
      { id: 'hundred_eyed', name: 'Hundred-Eyed Daoist (百眼魔君)', defaultPipeline: 'C' },
      { id: 'yellowbrow', name: 'Yellowbrow (黄眉)', defaultPipeline: 'A' },
      { id: 'scorpionlord', name: 'Scorpionlord (毒敌大王)', defaultPipeline: 'B' },
      { id: 'yin_tiger', name: 'Yin Tiger (寅虎)', defaultPipeline: 'B' },
      { id: 'red_boy', name: 'Red Boy (红孩儿)', defaultPipeline: 'B' },
      { id: 'yaksha_king', name: 'Yaksha King (夜叉王)', defaultPipeline: 'C' },
      { id: 'stone_monkey', name: 'Stone Monkey (石猴)', defaultPipeline: 'A' },
      { id: 'golden_cudgel', name: 'Golden Cudgel (金箍棒)', defaultPipeline: 'A' },
      { id: 'gourd', name: 'Supreme Gourd (宝葫芦)', defaultPipeline: 'A' },
      { id: 'loong_scales', name: 'Loong Scales (龙鳞)', defaultPipeline: 'A' },
      { id: 'great_sage', name: 'Great Sage\'s Armor (大圣套)', defaultPipeline: 'C' }
    ]
  },
  {
    id: 'mortal_cultivation',
    name: '凡人修仙传',
    characters: [
      { id: 'han_li', name: 'Han Li (韩立)', defaultPipeline: 'C' },
      { id: 'nan_gongwan', name: 'Nan Gongwan (南宫婉)', defaultPipeline: 'A' },
      { id: 'silver_moon', name: 'Silver Moon / Xue Ling (银月)', defaultPipeline: 'A' },
      { id: 'old_devil_han', name: 'Old Devil Han (韩老魔)', defaultPipeline: 'C' },
      { id: 'li_feiyu', name: 'Li Feiyu (厉飞雨)', defaultPipeline: 'B' },
      { id: 'gold_devouring_beetle', name: 'Gold Devouring Beetle (噬金虫)', defaultPipeline: 'B' },
      { id: 'green_bamboo_swords', name: 'Green Bamboo Bee Cloud Swords (青竹蜂云剑)', defaultPipeline: 'B' },
      { id: 'small_bottle', name: 'Mysterious Small Bottle (掌天瓶)', defaultPipeline: 'A' },
      { id: 'violet_spirit', name: 'Violet Spirit Fairy (紫灵仙子)', defaultPipeline: 'A' },
      { id: 'yuan_yao', name: 'Yuan Yao (元瑶)', defaultPipeline: 'A' },
      { id: 'carpenter_mo', name: 'Mo Juren (墨居仁)', defaultPipeline: 'A' },
      { id: 'crooked_soul', name: 'Crooked Soul (曲魂)', defaultPipeline: 'C' },
      { id: 'old_man_qing', name: 'Old Man Qing (青元子)', defaultPipeline: 'A' },
      { id: 'ancestor_linghu', name: 'Ancestor Linghu (令狐老祖)', defaultPipeline: 'A' },
      { id: 'six_paths', name: 'Six Paths Supreme Emperor (六道极圣)', defaultPipeline: 'C' },
      { id: 'azure_cloud_sect', name: 'Yellow Maple Valley (黄枫谷)', defaultPipeline: 'C' },
      { id: 'heavenly_south', name: 'Heavenly South Region (天南)', defaultPipeline: 'C' },
      { id: 'spirit_stone', name: 'Spirit Stone (灵石)', defaultPipeline: 'A' },
      { id: 'foundation_pill', name: 'Foundation Establishment Pill (筑基丹)', defaultPipeline: 'A' },
      { id: 'flying_boat', name: 'Divine Wind Boat (神风舟)', defaultPipeline: 'B' }
    ]
  },
  {
    id: 'one_piece',
    name: '海贼王 (One Piece)',
    characters: [
      { id: 'luffy_g5', name: 'Luffy Gear 5 (路飞 尼卡)', defaultPipeline: 'B' },
      { id: 'zoro', name: 'Roronoa Zoro (索隆)', defaultPipeline: 'A' },
      { id: 'sanji', name: 'Sanji (山治)', defaultPipeline: 'B' },
      { id: 'nami', name: 'Nami (娜美)', defaultPipeline: 'A' },
      { id: 'usopp', name: 'Usopp (乌索普)', defaultPipeline: 'A' },
      { id: 'chopper', name: 'Tony Tony Chopper (乔巴)', defaultPipeline: 'A' },
      { id: 'robin', name: 'Nico Robin (罗宾)', defaultPipeline: 'A' },
      { id: 'franky', name: 'Franky (弗兰奇)', defaultPipeline: 'C' },
      { id: 'brook', name: 'Brook (布鲁克)', defaultPipeline: 'B' },
      { id: 'jinbe', name: 'Jinbe (甚平)', defaultPipeline: 'C' },
      { id: 'shanks', name: 'Shanks (红发香克斯)', defaultPipeline: 'A' },
      { id: 'ace', name: 'Portgas D. Ace (艾斯)', defaultPipeline: 'B' },
      { id: 'sabo', name: 'Sabo (萨博)', defaultPipeline: 'B' },
      { id: 'law', name: 'Trafalgar Law (罗)', defaultPipeline: 'B' },
      { id: 'kid', name: 'Eustass Kid (基德)', defaultPipeline: 'C' },
      { id: 'yamato', name: 'Yamato (大和)', defaultPipeline: 'B' },
      { id: 'kaido', name: 'Kaido (凯多)', defaultPipeline: 'C' },
      { id: 'big_mom', name: 'Big Mom (大妈)', defaultPipeline: 'C' },
      { id: 'blackbeard', name: 'Blackbeard (黑胡子)', defaultPipeline: 'A' },
      { id: 'mihawk', name: 'Dracule Mihawk (鹰眼)', defaultPipeline: 'A' },
      { id: 'going_merry', name: 'Going Merry (黄金梅利号)', defaultPipeline: 'C' },
      { id: 'thousand_sunny', name: 'Thousand Sunny (万里阳光号)', defaultPipeline: 'C' },
      { id: 'devil_fruit', name: 'Devil Fruit (恶魔果实)', defaultPipeline: 'A' }
    ]
  },
  {
    id: 'yugioh',
    name: '游戏王 (Yu-Gi-Oh)',
    characters: [
      { id: 'blue_eyes', name: 'Blue-Eyes White Dragon (青眼白龙)', defaultPipeline: 'C' },
      { id: 'dark_magician', name: 'Dark Magician (黑魔导)', defaultPipeline: 'A' },
      { id: 'dark_magician_girl', name: 'Dark Magician Girl (黑魔导女孩)', defaultPipeline: 'A' },
      { id: 'red_eyes', name: 'Red-Eyes Black Dragon (真红眼黑龙)', defaultPipeline: 'B' },
      { id: 'exodia', name: 'Exodia the Forbidden One (被封印的艾克佐迪亚)', defaultPipeline: 'C' },
      { id: 'slifer', name: 'Slifer the Sky Dragon (天空龙)', defaultPipeline: 'C' },
      { id: 'obelisk', name: 'Obelisk the Tormentor (巨神兵)', defaultPipeline: 'C' },
      { id: 'ra', name: 'The Winged Dragon of Ra (翼神龙)', defaultPipeline: 'C' },
      { id: 'kuriboh', name: 'Kuriboh (栗子球)', defaultPipeline: 'A' },
      { id: 'time_wizard', name: 'Time Wizard (时间魔术师)', defaultPipeline: 'A' },
      { id: 'celtic_guardian', name: 'Celtic Guardian (精灵剑士)', defaultPipeline: 'B' },
      { id: 'gaia', name: 'Gaia The Fierce Knight (暗黑骑士盖亚)', defaultPipeline: 'B' },
      { id: 'summoned_skull', name: 'Summoned Skull (恶魔的召唤)', defaultPipeline: 'A' },
      { id: 'buster_blader', name: 'Buster Blader (龙破坏之剑士)', defaultPipeline: 'B' },
      { id: 'black_luster', name: 'Black Luster Soldier (混沌战士)', defaultPipeline: 'B' },
      { id: 'harpie_lady', name: 'Harpie Lady (鹰身女郎)', defaultPipeline: 'B' },
      { id: 'jinzo', name: 'Jinzo (人造人索加)', defaultPipeline: 'A' },
      { id: 'cyber_dragon', name: 'Cyber Dragon (电子龙)', defaultPipeline: 'B' },
      { id: 'neos', name: 'Elemental HERO Neos (元素英雄尼奥斯)', defaultPipeline: 'B' },
      { id: 'stardust', name: 'Stardust Dragon (星尘龙)', defaultPipeline: 'C' },
      { id: 'millennium_puzzle', name: 'Millennium Puzzle (千年积木)', defaultPipeline: 'A' },
      { id: 'duel_disk', name: 'Duel Disk (决斗盘)', defaultPipeline: 'A' }
    ]
  }
];

export const PIPELINES: PipelineConfig[] = [
  { id: 'A', name: 'Pipeline A: Static Truth', description: 'Introspective portrait, emotional depth, schematic overlays.' },
  { id: 'B', name: 'Pipeline B: Kinetic Burst', description: 'High speed action, motion blur, dynamic angles.' },
  { id: 'C', name: 'Pipeline C: Resonance Aftermath', description: 'Epic environmental scale, volumetric fog, colossal outlines.' }
];

export const MOCKUP_CONFIG = {
  watermarkText: '雪沐江南'
};

export const SHOWCASE_PROMPTS = {
  phoneMockup: `The input image is the digital wallpaper design. 
Generate a professional product photography shot of an **iPhone 15 Pro Max** displaying the PROVIDED INPUT IMAGE on its screen.

Setting: The phone is resting on a dark, premium texture surface (like carbon fiber or slate).
Screen: The screen is ACTIVE and GLOWING, vividly showing the provided anime artwork. Ensure the artwork fits the screen perfectly.
Lighting: Cinematic, moody \${env.lighting}, casting sleek reflections on the phone's glass bezel.
Background: Shallow depth of field, hinting at a high-tech or gamer lifestyle environment.
Style: Apple Commercial Aesthetic, 8K, Unreal Engine 5 render style.
\${watermarkInstruction}`,

  deskSetup: `The input image is the digital wallpaper design.
Generate a High-End Lifestyle Desk Setup Photography shot.

Subject: A premium wooden or matte black desk setup featuring an **iPad Pro** and an **iPhone** side-by-side.
Content: Both screens MUST be displaying the PROVIDED INPUT IMAGE (the anime wallpaper) clearly and vividly.
Props: A mechanical keyboard, a subtle \${themeColor} ambient light strip, and a coffee cup.
Atmosphere: Cozy, tech-focused, expensive. 
Focus: Sharp focus on the vivid digital art on the screens, with a creamy bokeh background.
\${watermarkInstruction}`,

  socialNote: `The input image is the main visual art.
Generate a Social Media Promo Poster / Magazine Layout.

Composition: Use the PROVIDED INPUT IMAGE as the central heroic visual. 
Overlay minimal, trendy typography on top or bottom (not covering the face/main action).
Text to include conceptually: "\${batchId}", "\${entityName}". 
Style: Trendy graphic design, high-saturation, poster design, e-commerce listing style.
Tags visible: #\${universeName} #\${charName}
\${watermarkInstruction}`
};

export const WATERMARK_INSTRUCTION = `
CRITICAL BRANDING INSTRUCTION:
You MUST integrate the brand name "雪沐江南" (Xue Mu Jiang Nan) into the image composition.
Style: Elegant, handwritten Chinese calligraphy or modern minimalist typography.
Placement: Subtly embedded in the corner, on a tag, or as a holographic overlay.
Icons: Include small, stylized icons representing "Apple", "Android", and "HarmonyOS" near the branding to indicate cross-platform compatibility.
The branding should look like a premium watermark or official product signature, NOT a cheap sticker.`;