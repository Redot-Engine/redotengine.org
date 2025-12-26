export function FixSidebar()
{
    const sidebar = document.getElementById('sidebar');
    const MBStyle = window.getComputedStyle(document.getElementById('header-menu-button'));
    sidebar.style.display = 'none';
}

export function menu()
{
    const sidebar = document.getElementById('sidebar');
    const SBStyle = window.getComputedStyle(sidebar);
    if (SBStyle.display == 'none')
    {
        sidebar.style.display = 'block';
    }
    else
    {
        sidebar.style.display = 'none';
    }
}

window.addEventListener("resize", () =>
{
    FixSidebar()
});