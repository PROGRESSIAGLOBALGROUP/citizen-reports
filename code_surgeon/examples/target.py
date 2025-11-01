def add(a, b):
    # BEGIN:hotfix_area
    return a + b  # buggy? suppose we need clamp or type cast
    # END:hotfix_area

def other():
    print("untouched")
