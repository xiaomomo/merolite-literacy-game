from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto('http://localhost:8081/')
    
    # 等待页面加载
    time.sleep(2)
    
    # 点击开始冒险
    page.click('#btn-start-adventure')
    time.sleep(1)
    
    # 点击第一个岛屿
    page.click('#island-1')
    time.sleep(1)
    
    # 点击开始关卡
    page.click('#btn-start-level')
    time.sleep(1)
    
    # 选择捉迷藏游戏
    page.click('[data-game-type="hide-seek"]')
    time.sleep(1)
    
    # 点击第一个字卡
    cards = page.query_selector_all('.game-card-large')
    if cards:
        cards[0].click()
        time.sleep(1)
    
    # 点击送字宝宝回家
    page.click('#btn-send-home')
    time.sleep(2)
    
    # 截图看看当前状态
    page.screenshot(path='test_result.png')
    
    # 获取游戏区域的内容
    game_content = page.query_selector('#game-content')
    if game_content:
        children_count = game_content.query_selector_all(':scope > *')
        print(f"game-content 子元素数量：{len(children_count)}")
    
    # 获取控制台日志
    console_logs = []
    page.on('console', lambda msg: console_logs.append(f"{msg.type}: {msg.text}"))
    
    time.sleep(3)
    browser.close()
    
    print("测试完成，截图已保存为 test_result.png")
