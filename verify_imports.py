import sys
print(f"Python {sys.version}")
try:
    from livekit.plugins import google
    print("Imported livekit.plugins.google")
    print(f"google dir: {dir(google)}")
    try:
        from livekit.plugins.google import realtime
        print("Imported livekit.plugins.google.realtime")
        print(f"realtime dir: {dir(realtime)}")
        if hasattr(realtime, 'RealtimeModel'):
            print("RealtimeModel found!")
        else:
            print("RealtimeModel NOT found in realtime module")
    except ImportError as e:
        print(f"Failed to import realtime: {e}")
except ImportError as e:
    print(f"Failed to import google plugin: {e}")
