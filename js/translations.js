/**
 * ChefOS Translations System
 * Supports the top 7 most spoken languages worldwide
 * No external API - all translations stored locally
 */

const translations = {
    en: {
        // Language Selector
        lang_select_title: "Welcome to ChefOS!",
        lang_select_subtitle: "Choose Your Language",
        lang_select_continue: "Continue",
        
        // Languages
        lang_english: "English",
        lang_chinese: "中文 (Chinese)",
        lang_hindi: "हिन्दी (Hindi)",
        lang_spanish: "Español (Spanish)",
        lang_french: "Français (French)",
        lang_arabic: "العربية (Arabic)",
        lang_bengali: "বাংলা (Bengali)",
        
        // Auth Modal
        auth_welcome: "Welcome Back!",
        auth_subtitle: "Sign in to continue to ChefOS Professional",
        auth_email: "Email",
        auth_password: "Password",
        auth_remember: "Remember me",
        auth_forgot: "Forgot password?",
        auth_signin: "Sign In",
        auth_no_account: "Don't have an account?",
        auth_create_link: "Create Account",
        auth_trial_banner: "7-Day Free Trial Available",
        auth_trial_desc: "Try all features free. No credit card required.",
        auth_error: "Invalid email or password",
        
        // Create Account Modal
        create_title: "Create Your Account",
        create_subtitle: "Choose your plan and get started with ChefOS",
        create_email: "Email",
        create_password: "Password",
        create_confirm_password: "Confirm Password",
        create_select_plan: "Select Your Plan",
        create_trial_title: "7-Day Free Trial",
        create_trial_desc: "Try all features free for 7 days. No credit card required.",
        create_pro_title: "Professional Subscription",
        create_pro_price: "$5/month",
        create_pro_desc: "Get full access to all ChefOS features including up-to 10,000 recipes, menu management, and smart shopping lists.",
        create_button: "Create Account",
        create_have_account: "Already have an account?",
        create_signin_link: "Sign In",
        
        // Sidebar Navigation
        nav_my_recipes: "My Recipes",
        nav_browse: "Browse Recipes",
        nav_scaler: "Recipe Scaler",
        nav_my_menus: "My Menus",
        nav_my_calendar: "My Calendar",
        nav_calculator: "Kitchen Calc",
        nav_settings: "Settings",
        nav_my_shopping: "My Shopping",
        nav_pdf_management: "PDF Management",
        nav_my_markets: "My Markets",
        nav_billing: "Billing",
        nav_signout: "Sign Out",
        nav_collapse: "Collapse",
        
        // Recipe Scaler Page
        scaler_title: "Recipe Scaler",
        scaler_subtitle: "Scale Your Recipes with Precision",
        scaler_recipe_name: "Recipe Name",
        scaler_recipe_name_placeholder: "Enter recipe name",
        scaler_original_yield: "Original Yield",
        scaler_desired_yield: "Desired Yield",
        scaler_yield_unit: "Yield Unit",
        scaler_ingredients: "Ingredients",
        scaler_ingredients_placeholder: "Enter ingredients (one per line)...",
        scaler_instructions: "Instructions",
        scaler_instructions_placeholder: "Optional: Add cooking instructions...",
        scaler_scale_button: "Scale Recipe",
        scaler_save_button: "Save Recipe",
        scaler_add_button: "Add Recipe",
        scaler_import_button: "Import Recipe",
        scaler_clear_button: "Clear",
        scaler_example: "Example Recipe",
        scaler_paste_tip: "Tip: Paste ingredients",
        scaler_paste_desc: "Copy and paste your recipe ingredients here for quick scaling",
        scaler_output_title: "Scaled Recipe Output",
        scaler_yield_summary: "Yield",
        
        // My Recipes Page
        recipes_title: "My Recipes",
        recipes_subtitle: "Your Saved Recipe Collection",
        recipes_search: "Search recipes by name...",
        recipes_empty_title: "No recipes yet",
        recipes_empty_desc: "Add your recipes to your collection",
        recipes_add_first: "Add First Recipe",
        recipes_add_recipe: "Add Recipe",
        recipes_view: "View",
        recipes_edit: "Edit",
        recipes_delete: "Delete",
        recipes_scale: "Scale",
        recipes_export: "Export",
        recipes_yield: "Yield",
        recipes_ingredients: "ingredients",
        
        // My Menus Page
        menus_title: "My Menus",
        menus_subtitle: "Organize Your Menu Collections",
        menus_search: "Search menus by name...",
        menus_empty_title: "No menus yet",
        menus_empty_desc: "Create your first menu collection",
        menus_add_first: "Create First Menu",
        menus_create: "Create Menu",
        menus_upload: "Upload Menu File",
        menus_view: "View",
        menus_edit: "Edit",
        menus_delete: "Delete",
        menus_download: "Download",
        menus_recipes: "recipes",
        menus_uploaded: "Uploaded",
        
        // Calendar Page
        calendar_title: "My Calendar",
        calendar_subtitle: "Plan Your Menu & Prep Schedule",
        calendar_today: "Today",
        calendar_month: "Month",
        calendar_week: "Week",
        calendar_stats_week: "This Week",
        calendar_stats_month: "This Month",
        calendar_stats_upcoming: "Upcoming",
        calendar_stats_items: "planned items",
        calendar_stats_next7: "in next 7 days",
        calendar_tip_title: "Tip: Tap any day to plan",
        calendar_tip_desc: "Add recipes, menus, or tasks to organize your schedule",
        
        // Calculator Page
        calculator_title: "Kitchen Calculator",
        calculator_subtitle: "Quick Conversions & Math",
        
        // Shopping Page
        shopping_title: "Shopping List",
        shopping_subtitle: "Professional Procurement & Inventory Planning",
        shopping_add_item: "Add Shopping Item",
        shopping_clear_checked: "Clear Checked",
        shopping_export: "Export List",
        shopping_produce: "Produce",
        shopping_proteins: "Proteins & Dairy",
        shopping_pantry: "Pantry & Dry Goods",
        shopping_other: "Other Items",
        shopping_items: "items",
        shopping_no_items: "No items in this category",
        shopping_subtotal: "Subtotal",
        shopping_items_priced: "items priced",
        shopping_start_title: "Start Your Shopping List",
        shopping_start_desc: "Generate a list from your recipes or add items manually.",
        shopping_start_tip: "Organize everything by category for efficient shopping!",
        
        // PDF Management
        pdf_title: "PDF Management",
        pdf_subtitle: "Store & Manage Your Recipe Documents",
        pdf_search: "Search PDFs by name...",
        pdf_upload: "Upload PDF",
        pdf_upload_first: "Upload First PDF",
        pdf_download: "Download",
        pdf_delete: "Delete",
        pdf_empty_title: "Add Your First PDF",
        pdf_empty_desc: "Upload and store your menu PDFs for easy access. Keep all your important documents in one place!",
        pdf_size: "Size",
        pdf_type: "Type",
        pdf_uploaded: "Uploaded",
        
        // Markets Page
        markets_title: "My Markets",
        markets_subtitle: "Your Favorite Shopping Locations",
        markets_full_subtitle: "Manage Your Supplier & Market Information",
        markets_search: "Search markets by name...",
        markets_add: "Add Market",
        markets_add_first: "Add First Market",
        markets_export: "Export Markets",
        markets_edit: "Edit",
        markets_delete: "Delete",
        markets_empty_title: "Add Your First Market",
        markets_empty_desc: "Save your suppliers and markets for quick access. Store contact info, addresses, and notes all in one place!",
        
        // Settings Page
        settings_title: "Settings",
        settings_subtitle: "Customize Your Experience",
        settings_account: "Account",
        settings_billing: "Billing & Subscription",
        settings_storage_title: "Data Storage Location",
        settings_storage_desc: "Choose where your ChefOS data is stored and managed.",
        settings_local: "Local Device Storage",
        settings_local_desc: "Data saved on this device only",
        settings_cloud: "ChefOS Cloud Storage",
        settings_cloud_desc: "Sync across all your devices",
        settings_storage_notice: "Important Data Storage Notice",
        settings_storage_warning: "Locally stored data is tied to your browser. Clearing your browsing history, cookies, or cache may permanently delete your saved recipes and settings. We recommend regularly downloading backups using the Data Export & Backup feature below.",
        settings_data_protection: "Data Protection",
        settings_pin_title: "PIN Protection",
        settings_pin_desc: "Lock sensitive features with a 4-digit PIN",
        settings_pin_enable: "Enable PIN Protection",
        settings_pin_entry: "Require PIN on App Entry",
        settings_pin_shopping: "Lock Shopping Lists",
        settings_set_pin: "Set PIN",
        settings_change_pin: "Change PIN",
        settings_export_title: "Data Export & Backup",
        settings_download_data: "Download My Data",
        settings_download_desc: "Export all your recipes, menus, shopping lists, and preferences as a secure backup file. Ideal for local storage, migration, or offline record-keeping.",
        settings_download_button: "Download Complete Backup",
        settings_display_title: "Display Mode",
        settings_display_desc: "Choose between light and dark mode",
        settings_dark_mode: "Enable Dark Mode",
        settings_pro_badges: "Show PRO Badges in Sidebar",
        settings_pro_badges_desc: "Hide or show the PRO badges next to premium features (appearance only)",
        settings_font_title: "Font Family",
        settings_font_desc: "Choose your preferred font for the interface",
        settings_theme_title: "Theme Selection",
        settings_theme_desc: "Choose your preferred color theme",
        settings_theme_info: "Theme colors apply across the entire application",
        
        // Billing Page
        billing_title: "Billing & Subscription",
        billing_subtitle: "Manage Your ChefOS Subscription",
        billing_current_plan: "Current Plan",
        billing_professional: "Professional Plan",
        billing_full_access: "Full access to all ChefOS features",
        billing_trial: "7-Day Free Trial",
        billing_days_remaining: "days remaining in trial",
        billing_subscribed: "Subscribed on:",
        billing_next_bill: "Next bill:",
        billing_status_active: "Active",
        billing_status_trial: "Trial Active",
        billing_feature1: "Save up-to 10,000 Recipes",
        billing_feature2: "Professional recipe scaler",
        billing_feature3: "Menu management & PDF storage",
        billing_feature4: "Smart shopping lists",
        billing_feature5: "Kitchen calculator with conversions",
        billing_account_title: "Account Information",
        billing_email: "Email Address",
        billing_member_since: "Member Since",
        
        // Common Actions
        action_save: "Save",
        action_cancel: "Cancel",
        action_delete: "Delete",
        action_edit: "Edit",
        action_view: "View",
        action_download: "Download",
        action_upload: "Upload",
        action_export: "Export",
        action_import: "Import",
        action_add: "Add",
        action_remove: "Remove",
        action_clear: "Clear",
        action_close: "Close",
        action_back: "Back",
        action_next: "Next",
        action_continue: "Continue",
        action_confirm: "Confirm",
        
        // Units
        unit_servings: "servings",
        unit_cup: "cup",
        unit_tbsp: "tbsp",
        unit_tsp: "tsp",
        unit_ml: "ml",
        unit_g: "g",
        unit_oz: "oz",
        unit_lb: "lb",
        unit_kg: "kg",
        
        // Days of Week
        day_sunday: "Sun",
        day_monday: "Mon",
        day_tuesday: "Tue",
        day_wednesday: "Wed",
        day_thursday: "Thu",
        day_friday: "Fri",
        day_saturday: "Sat",
        
        // Months
        month_january: "January",
        month_february: "February",
        month_march: "March",
        month_april: "April",
        month_may: "May",
        month_june: "June",
        month_july: "July",
        month_august: "August",
        month_september: "September",
        month_october: "October",
        month_november: "November",
        month_december: "December",
        
        // Toast Messages
        toast_welcome_trial: "Welcome to ChefOS! Your 7-day free trial has started.",
        toast_welcome_pro: "Welcome to ChefOS Professional!",
        toast_signed_out: "You have been signed out",
        toast_recipe_saved: "Recipe saved successfully!",
        toast_recipe_deleted: "Recipe deleted successfully!",
        toast_menu_created: "Menu created successfully!",
        toast_menu_deleted: "Menu deleted successfully!",
        
        // Pro Badge
        pro_badge: "PRO",
        
        // Mobile Bottom Nav
        mobile_recipes: "Recipes",
        mobile_menus: "Menus",
        mobile_shopping: "Shopping",
        mobile_calculator: "Calculator",
        mobile_settings: "Settings",
    },
    
    zh: {
        // Language Selector
        lang_select_title: "欢迎使用 ChefOS！",
        lang_select_subtitle: "选择您的语言",
        lang_select_continue: "继续",
        
        // Languages
        lang_english: "English",
        lang_chinese: "中文 (Chinese)",
        lang_hindi: "हिन्दी (Hindi)",
        lang_spanish: "Español (Spanish)",
        lang_french: "Français (French)",
        lang_arabic: "العربية (Arabic)",
        lang_bengali: "বাংলা (Bengali)",
        
        // Auth Modal
        auth_welcome: "欢迎回来！",
        auth_subtitle: "登录以继续使用 ChefOS Professional",
        auth_email: "电子邮件",
        auth_password: "密码",
        auth_remember: "记住我",
        auth_forgot: "忘记密码？",
        auth_signin: "登录",
        auth_no_account: "还没有账户？",
        auth_create_link: "创建账户",
        auth_trial_banner: "提供7天免费试用",
        auth_trial_desc: "免费试用所有功能。无需信用卡。",
        auth_error: "电子邮件或密码无效",
        
        // Create Account Modal
        create_title: "创建您的账户",
        create_subtitle: "选择您的计划并开始使用 ChefOS",
        create_email: "电子邮件",
        create_password: "密码",
        create_confirm_password: "确认密码",
        create_select_plan: "选择您的计划",
        create_trial_title: "7天免费试用",
        create_trial_desc: "免费试用所有功能7天。无需信用卡。",
        create_pro_title: "专业订阅",
        create_pro_price: "$5/月",
        create_pro_desc: "完全访问所有 ChefOS 功能，包括最多10,000个食谱、菜单管理和智能购物清单。",
        create_button: "创建账户",
        create_have_account: "已有账户？",
        create_signin_link: "登录",
        
        // Sidebar Navigation
        nav_my_recipes: "我的食谱",
        nav_browse: "浏览食谱",
        nav_scaler: "食谱缩放器",
        nav_my_menus: "我的菜单",
        nav_my_calendar: "我的日历",
        nav_calculator: "厨房计算器",
        nav_settings: "设置",
        nav_my_shopping: "我的购物",
        nav_pdf_management: "PDF管理",
        nav_my_markets: "我的市场",
        nav_billing: "账单",
        nav_signout: "退出登录",
        nav_collapse: "收起",
        
        // Recipe Scaler Page
        scaler_title: "食谱缩放器",
        scaler_subtitle: "精确缩放您的食谱",
        scaler_recipe_name: "食谱名称",
        scaler_recipe_name_placeholder: "输入食谱名称",
        scaler_original_yield: "原始份量",
        scaler_desired_yield: "目标份量",
        scaler_yield_unit: "份量单位",
        scaler_ingredients: "配料",
        scaler_ingredients_placeholder: "输入配料（每行一个）...",
        scaler_instructions: "说明",
        scaler_instructions_placeholder: "可选：添加烹饪说明...",
        scaler_scale_button: "缩放食谱",
        scaler_save_button: "保存食谱",
        scaler_add_button: "添加食谱",
        scaler_import_button: "导入食谱",
        scaler_clear_button: "清除",
        scaler_example: "示例食谱",
        scaler_paste_tip: "提示：粘贴配料",
        scaler_paste_desc: "在此处复制并粘贴您的食谱配料以快速缩放",
        scaler_output_title: "缩放食谱输出",
        scaler_yield_summary: "份量",
        
        // My Recipes Page
        recipes_title: "我的食谱",
        recipes_subtitle: "您保存的食谱集合",
        recipes_search: "按名称搜索食谱...",
        recipes_empty_title: "还没有食谱",
        recipes_empty_desc: "将食谱添加到您的收藏",
        recipes_add_first: "添加第一个食谱",
        recipes_add_recipe: "添加食谱",
        recipes_view: "查看",
        recipes_edit: "编辑",
        recipes_delete: "删除",
        recipes_scale: "缩放",
        recipes_export: "导出",
        recipes_yield: "份量",
        recipes_ingredients: "配料",
        
        // My Menus Page
        menus_title: "我的菜单",
        menus_subtitle: "整理您的菜单集合",
        menus_search: "按名称搜索菜单...",
        menus_empty_title: "还没有菜单",
        menus_empty_desc: "创建您的第一个菜单集合",
        menus_add_first: "创建第一个菜单",
        menus_create: "创建菜单",
        menus_upload: "上传菜单文件",
        menus_view: "查看",
        menus_edit: "编辑",
        menus_delete: "删除",
        menus_download: "下载",
        menus_recipes: "食谱",
        menus_uploaded: "已上传",
        
        // Calendar Page
        calendar_title: "我的日历",
        calendar_subtitle: "计划您的菜单和准备时间表",
        calendar_today: "今天",
        calendar_month: "月",
        calendar_week: "周",
        calendar_stats_week: "本周",
        calendar_stats_month: "本月",
        calendar_stats_upcoming: "即将到来",
        calendar_stats_items: "计划项目",
        calendar_stats_next7: "未来7天内",
        calendar_tip_title: "提示：点击任何一天进行计划",
        calendar_tip_desc: "添加食谱、菜单或任务来组织您的日程",
        
        // Calculator Page
        calculator_title: "厨房计算器",
        calculator_subtitle: "快速转换和数学计算",
        
        // Shopping Page
        shopping_title: "购物清单",
        shopping_subtitle: "专业采购与库存规划",
        shopping_add_item: "添加购物项目",
        shopping_clear_checked: "清除已选",
        shopping_export: "导出列表",
        shopping_produce: "农产品",
        shopping_proteins: "蛋白质和乳制品",
        shopping_pantry: "储藏室和干货",
        shopping_other: "其他物品",
        shopping_items: "项目",
        shopping_no_items: "此类别中没有项目",
        shopping_subtotal: "小计",
        shopping_items_priced: "已定价项目",
        shopping_start_title: "开始您的购物清单",
        shopping_start_desc: "从您的食谱生成清单或手动添加项目。",
        shopping_start_tip: "按类别组织所有内容以实现高效购物！",
        
        // PDF Management
        pdf_title: "PDF管理",
        pdf_subtitle: "存储和管理您的食谱文档",
        pdf_search: "按名称搜索PDF...",
        pdf_upload: "上传PDF",
        pdf_upload_first: "上传第一个PDF",
        pdf_download: "下载",
        pdf_delete: "删除",
        pdf_empty_title: "添加您的第一个PDF",
        pdf_empty_desc: "上传并存储您的菜单PDF以便快速访问。将所有重要文档保存在一个地方！",
        pdf_size: "大小",
        pdf_type: "类型",
        pdf_uploaded: "已上传",
        
        // Markets Page
        markets_title: "我的市场",
        markets_subtitle: "您最喜欢的购物地点",
        markets_full_subtitle: "管理您的供应商和市场信息",
        markets_search: "按名称搜索市场...",
        markets_add: "添加市场",
        markets_add_first: "添加第一个市场",
        markets_export: "导出市场",
        markets_edit: "编辑",
        markets_delete: "删除",
        markets_empty_title: "添加您的第一个市场",
        markets_empty_desc: "保存您的供应商和市场以便快速访问。将联系信息、地址和备注全部存储在一个地方！",
        
        // Settings Page
        settings_title: "设置",
        settings_subtitle: "自定义您的体验",
        settings_account: "账户",
        settings_billing: "账单和订阅",
        settings_storage_title: "数据存储位置",
        settings_storage_desc: "选择您的 ChefOS 数据存储和管理位置。",
        settings_local: "本地设备存储",
        settings_local_desc: "数据仅保存在此设备上",
        settings_cloud: "ChefOS 云存储",
        settings_cloud_desc: "在所有设备上同步",
        settings_storage_notice: "重要数据存储通知",
        settings_storage_warning: "本地存储的数据与您的浏览器绑定。清除浏览历史记录、Cookie或缓存可能会永久删除您保存的食谱和设置。我们建议使用下面的数据导出和备份功能定期下载备份。",
        settings_data_protection: "数据保护",
        settings_pin_title: "PIN保护",
        settings_pin_desc: "使用4位PIN锁定敏感功能",
        settings_pin_enable: "启用PIN保护",
        settings_pin_entry: "应用启动时需要PIN",
        settings_pin_shopping: "锁定购物清单",
        settings_set_pin: "设置PIN",
        settings_change_pin: "更改PIN",
        settings_export_title: "数据导出和备份",
        settings_download_data: "下载我的数据",
        settings_download_desc: "将所有食谱、菜单、购物清单和偏好设置导出为安全备份文件。适用于本地存储、迁移或离线记录保存。",
        settings_download_button: "下载完整备份",
        settings_display_title: "显示模式",
        settings_display_desc: "在浅色和深色模式之间选择",
        settings_dark_mode: "启用深色模式",
        settings_pro_badges: "在侧边栏显示PRO徽章",
        settings_pro_badges_desc: "隐藏或显示高级功能旁边的PRO徽章（仅外观）",
        settings_font_title: "字体系列",
        settings_font_desc: "选择您喜欢的界面字体",
        settings_theme_title: "主题选择",
        settings_theme_desc: "选择您喜欢的颜色主题",
        settings_theme_info: "主题颜色应用于整个应用程序",
        
        // Billing Page
        billing_title: "账单和订阅",
        billing_subtitle: "管理您的 ChefOS 订阅",
        billing_current_plan: "当前计划",
        billing_professional: "专业计划",
        billing_full_access: "完全访问所有 ChefOS 功能",
        billing_trial: "7天免费试用",
        billing_days_remaining: "试用剩余天数",
        billing_subscribed: "订阅日期：",
        billing_next_bill: "下次账单：",
        billing_status_active: "活跃",
        billing_status_trial: "试用激活",
        billing_feature1: "保存多达10,000个食谱",
        billing_feature2: "专业食谱缩放器",
        billing_feature3: "菜单管理和PDF存储",
        billing_feature4: "智能购物清单",
        billing_feature5: "厨房计算器和转换",
        billing_account_title: "账户信息",
        billing_email: "电子邮件地址",
        billing_member_since: "会员开始时间",
        
        // Common Actions
        action_save: "保存",
        action_cancel: "取消",
        action_delete: "删除",
        action_edit: "编辑",
        action_view: "查看",
        action_download: "下载",
        action_upload: "上传",
        action_export: "导出",
        action_import: "导入",
        action_add: "添加",
        action_remove: "移除",
        action_clear: "清除",
        action_close: "关闭",
        action_back: "返回",
        action_next: "下一步",
        action_continue: "继续",
        action_confirm: "确认",
        
        // Toast Messages
        toast_welcome_trial: "欢迎来到 ChefOS！您的7天免费试用已开始。",
        toast_welcome_pro: "欢迎来到 ChefOS Professional！",
        toast_signed_out: "您已退出登录",
        toast_recipe_saved: "食谱保存成功！",
        toast_recipe_deleted: "食谱删除成功！",
        toast_menu_created: "菜单创建成功！",
        toast_menu_deleted: "菜单删除成功！",
        
        // Pro Badge
        pro_badge: "专业版",
        
        // Mobile Bottom Nav
        mobile_recipes: "食谱",
        mobile_menus: "菜单",
        mobile_shopping: "购物",
        mobile_calculator: "计算器",
        mobile_settings: "设置",
    },
    
    hi: {
        // Language Selector
        lang_select_title: "ChefOS में आपका स्वागत है!",
        lang_select_subtitle: "अपनी भाषा चुनें",
        lang_select_continue: "जारी रखें",
        
        // Languages
        lang_english: "English",
        lang_chinese: "中文 (Chinese)",
        lang_hindi: "हिन्दी (Hindi)",
        lang_spanish: "Español (Spanish)",
        lang_french: "Français (French)",
        lang_arabic: "العربية (Arabic)",
        lang_bengali: "বাংলা (Bengali)",
        
        // Auth Modal
        auth_welcome: "वापसी पर स्वागत है!",
        auth_subtitle: "ChefOS Professional में जारी रखने के लिए साइन इन करें",
        auth_email: "ईमेल",
        auth_password: "पासवर्ड",
        auth_remember: "मुझे याद रखें",
        auth_forgot: "पासवर्ड भूल गए?",
        auth_signin: "साइन इन करें",
        auth_no_account: "खाता नहीं है?",
        auth_create_link: "खाता बनाएं",
        auth_trial_banner: "7-दिन का निःशुल्क परीक्षण उपलब्ध है",
        auth_trial_desc: "सभी सुविधाओं को निःशुल्क आज़माएं। क्रेडिट कार्ड की आवश्यकता नहीं।",
        auth_error: "अमान्य ईमेल या पासवर्ड",
        
        // Create Account Modal
        create_title: "अपना खाता बनाएं",
        create_subtitle: "अपनी योजना चुनें और ChefOS के साथ शुरुआत करें",
        create_email: "ईमेल",
        create_password: "पासवर्ड",
        create_confirm_password: "पासवर्ड की पुष्टि करें",
        create_select_plan: "अपनी योजना चुनें",
        create_trial_title: "7-दिन का निःशुल्क परीक्षण",
        create_trial_desc: "सभी सुविधाओं को 7 दिनों के लिए निःशुल्क आज़माएं। क्रेडिट कार्ड की आवश्यकता नहीं।",
        create_pro_title: "पेशेवर सदस्यता",
        create_pro_price: "$5/माह",
        create_pro_desc: "10,000 व्यंजनों, मेनू प्रबंधन और स्मार्ट शॉपिंग सूचियों सहित सभी ChefOS सुविधाओं तक पूर्ण पहुंच प्राप्त करें।",
        create_button: "खाता बनाएं",
        create_have_account: "पहले से खाता है?",
        create_signin_link: "साइन इन करें",
        
        // Sidebar Navigation
        nav_my_recipes: "मेरे व्यंजन",
        nav_browse: "व्यंजन ब्राउज़ करें",
        nav_scaler: "रेसिपी स्केलर",
        nav_my_menus: "मेरे मेनू",
        nav_my_calendar: "मेरा कैलेंडर",
        nav_calculator: "किचन कैल्क",
        nav_settings: "सेटिंग्स",
        nav_my_shopping: "मेरी खरीदारी",
        nav_pdf_management: "PDF प्रबंधन",
        nav_my_markets: "मेरे बाज़ार",
        nav_billing: "बिलिंग",
        nav_signout: "साइन आउट",
        nav_collapse: "छोटा करें",
        
        // Common
        action_save: "सहेजें",
        action_cancel: "रद्द करें",
        action_delete: "हटाएं",
        action_edit: "संपादित करें",
        action_view: "देखें",
        action_continue: "जारी रखें",
        action_confirm: "पुष्टि करें",
        
        pro_badge: "प्रो",
    },
    
    es: {
        // Language Selector
        lang_select_title: "¡Bienvenido a ChefOS!",
        lang_select_subtitle: "Elige tu idioma",
        lang_select_continue: "Continuar",
        
        // Languages
        lang_english: "English",
        lang_chinese: "中文 (Chinese)",
        lang_hindi: "हिन्दी (Hindi)",
        lang_spanish: "Español (Spanish)",
        lang_french: "Français (French)",
        lang_arabic: "العربية (Arabic)",
        lang_bengali: "বাংলা (Bengali)",
        
        // Auth Modal
        auth_welcome: "¡Bienvenido de nuevo!",
        auth_subtitle: "Inicia sesión para continuar con ChefOS Professional",
        auth_email: "Correo electrónico",
        auth_password: "Contraseña",
        auth_remember: "Recuérdame",
        auth_forgot: "¿Olvidaste tu contraseña?",
        auth_signin: "Iniciar sesión",
        auth_no_account: "¿No tienes una cuenta?",
        auth_create_link: "Crear cuenta",
        auth_trial_banner: "Prueba gratuita de 7 días disponible",
        auth_trial_desc: "Prueba todas las funciones gratis. No se requiere tarjeta de crédito.",
        auth_error: "Correo electrónico o contraseña inválidos",
        
        // Create Account Modal
        create_title: "Crea tu cuenta",
        create_subtitle: "Elige tu plan y comienza con ChefOS",
        create_email: "Correo electrónico",
        create_password: "Contraseña",
        create_confirm_password: "Confirmar contraseña",
        create_select_plan: "Selecciona tu plan",
        create_trial_title: "Prueba gratuita de 7 días",
        create_trial_desc: "Prueba todas las funciones gratis durante 7 días. No se requiere tarjeta de crédito.",
        create_pro_title: "Suscripción profesional",
        create_pro_price: "$5/mes",
        create_pro_desc: "Obtén acceso completo a todas las funciones de ChefOS, incluyendo hasta 10,000 recetas, gestión de menús y listas de compras inteligentes.",
        create_button: "Crear cuenta",
        create_have_account: "¿Ya tienes una cuenta?",
        create_signin_link: "Iniciar sesión",
        
        // Sidebar Navigation
        nav_my_recipes: "Mis Recetas",
        nav_browse: "Explorar Recetas",
        nav_scaler: "Escalador de Recetas",
        nav_my_menus: "Mis Menús",
        nav_my_calendar: "Mi Calendario",
        nav_calculator: "Calc Cocina",
        nav_settings: "Configuración",
        nav_my_shopping: "Mis Compras",
        nav_pdf_management: "Gestión de PDF",
        nav_my_markets: "Mis Mercados",
        nav_billing: "Facturación",
        nav_signout: "Cerrar sesión",
        nav_collapse: "Contraer",
        
        // Common
        action_save: "Guardar",
        action_cancel: "Cancelar",
        action_delete: "Eliminar",
        action_edit: "Editar",
        action_view: "Ver",
        action_continue: "Continuar",
        action_confirm: "Confirmar",
        
        pro_badge: "PRO",
    },
    
    fr: {
        // Language Selector
        lang_select_title: "Bienvenue sur ChefOS!",
        lang_select_subtitle: "Choisissez votre langue",
        lang_select_continue: "Continuer",
        
        // Languages
        lang_english: "English",
        lang_chinese: "中文 (Chinese)",
        lang_hindi: "हिन्दी (Hindi)",
        lang_spanish: "Español (Spanish)",
        lang_french: "Français (French)",
        lang_arabic: "العربية (Arabic)",
        lang_bengali: "বাংলা (Bengali)",
        
        // Auth Modal
        auth_welcome: "Bon retour!",
        auth_subtitle: "Connectez-vous pour continuer vers ChefOS Professional",
        auth_email: "E-mail",
        auth_password: "Mot de passe",
        auth_remember: "Se souvenir de moi",
        auth_forgot: "Mot de passe oublié?",
        auth_signin: "Se connecter",
        auth_no_account: "Vous n'avez pas de compte?",
        auth_create_link: "Créer un compte",
        auth_trial_banner: "Essai gratuit de 7 jours disponible",
        auth_trial_desc: "Essayez toutes les fonctionnalités gratuitement. Aucune carte de crédit requise.",
        auth_error: "E-mail ou mot de passe invalide",
        
        // Create Account Modal
        create_title: "Créez votre compte",
        create_subtitle: "Choisissez votre forfait et commencez avec ChefOS",
        create_email: "E-mail",
        create_password: "Mot de passe",
        create_confirm_password: "Confirmer le mot de passe",
        create_select_plan: "Sélectionnez votre forfait",
        create_trial_title: "Essai gratuit de 7 jours",
        create_trial_desc: "Essayez toutes les fonctionnalités gratuitement pendant 7 jours. Aucune carte de crédit requise.",
        create_pro_title: "Abonnement professionnel",
        create_pro_price: "$5/mois",
        create_pro_desc: "Accédez à toutes les fonctionnalités de ChefOS, y compris jusqu'à 10 000 recettes, gestion de menus et listes de courses intelligentes.",
        create_button: "Créer un compte",
        create_have_account: "Vous avez déjà un compte?",
        create_signin_link: "Se connecter",
        
        // Sidebar Navigation
        nav_my_recipes: "Mes Recettes",
        nav_browse: "Parcourir les Recettes",
        nav_scaler: "Échelle de Recette",
        nav_my_menus: "Mes Menus",
        nav_my_calendar: "Mon Calendrier",
        nav_calculator: "Calc Cuisine",
        nav_settings: "Paramètres",
        nav_my_shopping: "Mes Courses",
        nav_pdf_management: "Gestion PDF",
        nav_my_markets: "Mes Marchés",
        nav_billing: "Facturation",
        nav_signout: "Déconnexion",
        nav_collapse: "Réduire",
        
        // Common
        action_save: "Enregistrer",
        action_cancel: "Annuler",
        action_delete: "Supprimer",
        action_edit: "Modifier",
        action_view: "Voir",
        action_continue: "Continuer",
        action_confirm: "Confirmer",
        
        pro_badge: "PRO",
    },
    
    ar: {
        // Language Selector
        lang_select_title: "!مرحباً بك في ChefOS",
        lang_select_subtitle: "اختر لغتك",
        lang_select_continue: "متابعة",
        
        // Languages
        lang_english: "English",
        lang_chinese: "中文 (Chinese)",
        lang_hindi: "हिन्दी (Hindi)",
        lang_spanish: "Español (Spanish)",
        lang_french: "Français (French)",
        lang_arabic: "العربية (Arabic)",
        lang_bengali: "বাংলা (Bengali)",
        
        // Auth Modal
        auth_welcome: "!مرحباً بعودتك",
        auth_subtitle: "ChefOS Professional سجل الدخول للمتابعة إلى",
        auth_email: "البريد الإلكتروني",
        auth_password: "كلمة المرور",
        auth_remember: "تذكرني",
        auth_forgot: "هل نسيت كلمة المرور؟",
        auth_signin: "تسجيل الدخول",
        auth_no_account: "ليس لديك حساب؟",
        auth_create_link: "إنشاء حساب",
        auth_trial_banner: "نسخة تجريبية مجانية لمدة 7 أيام",
        auth_trial_desc: "جرب جميع الميزات مجاناً. لا حاجة لبطاقة ائتمان.",
        auth_error: "البريد الإلكتروني أو كلمة المرور غير صالحة",
        
        // Sidebar Navigation
        nav_my_recipes: "وصفاتي",
        nav_browse: "تصفح الوصفات",
        nav_scaler: "مقياس الوصفات",
        nav_my_menus: "قوائمي",
        nav_my_calendar: "تقويمي",
        nav_calculator: "آلة حاسبة",
        nav_settings: "الإعدادات",
        nav_my_shopping: "تسوقي",
        nav_pdf_management: "PDF إدارة",
        nav_my_markets: "أسواقي",
        nav_billing: "الفواتير",
        nav_signout: "تسجيل الخروج",
        nav_collapse: "طي",
        
        // Common
        action_save: "حفظ",
        action_cancel: "إلغاء",
        action_delete: "حذف",
        action_edit: "تعديل",
        action_view: "عرض",
        action_continue: "متابعة",
        action_confirm: "تأكيد",
        
        pro_badge: "احترافي",
    },
    
    bn: {
        // Language Selector
        lang_select_title: "ChefOS-এ স্বাগতম!",
        lang_select_subtitle: "আপনার ভাষা নির্বাচন করুন",
        lang_select_continue: "চালিয়ে যান",
        
        // Languages
        lang_english: "English",
        lang_chinese: "中文 (Chinese)",
        lang_hindi: "हिन्दी (Hindi)",
        lang_spanish: "Español (Spanish)",
        lang_french: "Français (French)",
        lang_arabic: "العربية (Arabic)",
        lang_bengali: "বাংলা (Bengali)",
        
        // Auth Modal
        auth_welcome: "আবার স্বাগতম!",
        auth_subtitle: "ChefOS Professional-এ চালিয়ে যেতে সাইন ইন করুন",
        auth_email: "ইমেইল",
        auth_password: "পাসওয়ার্ড",
        auth_remember: "আমাকে মনে রাখুন",
        auth_forgot: "পাসওয়ার্ড ভুলে গেছেন?",
        auth_signin: "সাইন ইন করুন",
        auth_no_account: "অ্যাকাউন্ট নেই?",
        auth_create_link: "অ্যাকাউন্ট তৈরি করুন",
        auth_trial_banner: "৭-দিনের বিনামূল্যে ট্রায়াল উপলব্ধ",
        auth_trial_desc: "সমস্ত বৈশিষ্ট্য বিনামূল্যে ব্যবহার করুন। ক্রেডিট কার্ডের প্রয়োজন নেই।",
        
        // Sidebar Navigation
        nav_my_recipes: "আমার রেসিপি",
        nav_browse: "রেসিপি ব্রাউজ করুন",
        nav_scaler: "রেসিপি স্কেলার",
        nav_my_menus: "আমার মেনু",
        nav_my_calendar: "আমার ক্যালেন্ডার",
        nav_calculator: "রান্নাঘর ক্যালক",
        nav_settings: "সেটিংস",
        nav_my_shopping: "আমার কেনাকাটা",
        nav_signout: "সাইন আউট",
        
        // Common
        action_save: "সংরক্ষণ করুন",
        action_cancel: "বাতিল করুন",
        action_delete: "মুছুন",
        action_continue: "চালিয়ে যান",
        action_confirm: "নিশ্চিত করুন",
        
        pro_badge: "প্রো",
    },
    
    pt: {
        // Language Selector
        lang_select_title: "Bem-vindo ao ChefOS!",
        lang_select_subtitle: "Escolha seu idioma",
        lang_select_continue: "Continuar",
        
        // Languages  
        lang_english: "English",
        lang_chinese: "中文 (Chinese)",
        lang_hindi: "हिन्दी (Hindi)",
        lang_spanish: "Español (Spanish)",
        lang_french: "Français (French)",
        lang_arabic: "العربية (Arabic)",
        lang_bengali: "বাংলা (Bengali)",
        
        // Auth Modal
        auth_welcome: "Bem-vindo de volta!",
        auth_subtitle: "Faça login para continuar no ChefOS Professional",
        auth_email: "E-mail",
        auth_password: "Senha",
        auth_remember: "Lembrar de mim",
        auth_forgot: "Esqueceu a senha?",
        auth_signin: "Entrar",
        auth_no_account: "Não tem uma conta?",
        auth_create_link: "Criar conta",
        auth_trial_banner: "Teste grátis de 7 dias disponível",
        auth_trial_desc: "Experimente todos os recursos gratuitamente. Não é necessário cartão de crédito.",
        
        // Sidebar Navigation
        nav_my_recipes: "Minhas Receitas",
        nav_browse: "Explorar Receitas",
        nav_scaler: "Escalador de Receitas",
        nav_my_menus: "Meus Menus",
        nav_my_calendar: "Meu Calendário",
        nav_calculator: "Calc Cozinha",
        nav_settings: "Configurações",
        nav_my_shopping: "Minhas Compras",
        nav_signout: "Sair",
        
        // Common
        action_save: "Salvar",
        action_cancel: "Cancelar",
        action_delete: "Excluir",
        action_continue: "Continuar",
        action_confirm: "Confirmar",
        
        pro_badge: "PRO",
    },
    
    de: {
        // Language Selector
        lang_select_title: "Willkommen bei ChefOS!",
        lang_select_subtitle: "Wählen Sie Ihre Sprache",
        lang_select_continue: "Fortfahren",
        
        // Languages
        lang_english: "English",
        lang_chinese: "中文 (Chinese)",
        lang_hindi: "हिन्दी (Hindi)",
        lang_spanish: "Español (Spanish)",
        lang_french: "Français (French)",
        lang_arabic: "العربية (Arabic)",
        lang_bengali: "বাংলা (Bengali)",
        
        // Auth Modal
        auth_welcome: "Willkommen zurück!",
        auth_subtitle: "Melden Sie sich an, um ChefOS Professional fortzusetzen",
        auth_email: "E-Mail",
        auth_password: "Passwort",
        auth_remember: "Angemeldet bleiben",
        auth_forgot: "Passwort vergessen?",
        auth_signin: "Anmelden",
        auth_no_account: "Noch kein Konto?",
        auth_create_link: "Konto erstellen",
        auth_trial_banner: "7-tägige kostenlose Testversion verfügbar",
        auth_trial_desc: "Testen Sie alle Funktionen kostenlos. Keine Kreditkarte erforderlich.",
        
        // Sidebar Navigation
        nav_my_recipes: "Meine Rezepte",
        nav_browse: "Rezepte durchsuchen",
        nav_scaler: "Rezept-Skalierer",
        nav_my_menus: "Meine Menüs",
        nav_my_calendar: "Mein Kalender",
        nav_calculator: "Küchen Rechner",
        nav_settings: "Einstellungen",
        nav_my_shopping: "Mein Einkauf",
        nav_signout: "Abmelden",
        
        // Common
        action_save: "Speichern",
        action_cancel: "Abbrechen",
        action_delete: "Löschen",
        action_continue: "Fortfahren",
        action_confirm: "Bestätigen",
        
        pro_badge: "PRO",
    }
};

// Get current language from localStorage or default to English
function getCurrentLanguage() {
    return localStorage.getItem('chefos_language') || 'en';
}

// Set language
function setLanguage(langCode) {
    localStorage.setItem('chefos_language', langCode);
    applyTranslations(langCode);
}

// Get translation for a key
function t(key) {
    const lang = getCurrentLanguage();
    const translation = translations[lang] && translations[lang][key];
    return translation || translations.en[key] || key;
}

// Apply translations to the entire UI
function applyTranslations(langCode) {
    const lang = langCode || getCurrentLanguage();
    
    if (!translations[lang]) {
        console.error(`Language ${lang} not found, falling back to English`);
        return applyTranslations('en');
    }
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[lang][key];
        
        if (translation) {
            // Check if it's an input placeholder
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.value = translation;
                }
            } else {
                element.textContent = translation;
            }
        }
    });
    
    // Update document title
    document.title = 'ChefOS Professional Edition';
    
    // Apply RTL for Arabic
    if (lang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.body.classList.add('rtl-mode');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.body.classList.remove('rtl-mode');
    }
}

// Make functions globally available
window.t = t;
window.setLanguage = setLanguage;
window.getCurrentLanguage = getCurrentLanguage;
window.applyTranslations = applyTranslations;
window.translations = translations;

console.log('✅ ChefOS Translations Loaded - 7 Languages Available');

